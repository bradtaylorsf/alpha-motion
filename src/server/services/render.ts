import { spawn } from 'child_process';
import { v4 as uuid } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  type VideoCodec,
  type AudioCodec,
  type ProResProfile,
  type ExportOptions,
  getExtension,
  getDefaultCrf,
  getDefaultAudioCodec,
  isValidCrf,
  isValidAudioCodec,
  DEFAULT_PRORES_PROFILE,
} from '../../shared/codec-config';

export interface VideoConfig {
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
}

export interface RenderJob {
  id: string;
  componentId: string;
  status: 'queued' | 'rendering' | 'complete' | 'failed';
  progress: number; // 0-100
  outputPath?: string;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

const jobs = new Map<string, RenderJob>();

const TEMP_DIR = path.resolve(process.cwd(), '.remotion-render');
const OUTPUT_DIR = path.resolve(process.cwd(), 'public/assets/renders');
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

async function cleanupTempDir(jobId: string): Promise<void> {
  const jobDir = path.join(TEMP_DIR, jobId);
  try {
    await fs.rm(jobDir, { recursive: true, force: true });
  } catch (e) {
    console.error(`[Render ${jobId}] Failed to cleanup temp dir:`, e);
  }
}

/**
 * Transform asset URL paths for CLI rendering.
 * Replaces '/assets/...' paths with staticFile() calls for Remotion.
 */
function transformAssetPaths(sourceCode: string): { code: string; hasAssets: boolean } {
  let hasAssets = false;

  // Match URL paths starting with /assets/ in string literals
  // Handles both single and double quotes
  const transformed = sourceCode.replace(
    /(['"`])\/assets\/(.*?)\1/g,
    (match, quote, assetPath) => {
      hasAssets = true;
      // Use staticFile() for Remotion CLI rendering
      return `staticFile('assets/${assetPath}')`;
    }
  );

  return { code: transformed, hasAssets };
}

/**
 * Ensure staticFile is imported if assets are used.
 */
function ensureStaticFileImport(sourceCode: string): string {
  // Check if staticFile is already imported
  if (sourceCode.includes('staticFile')) {
    // Check if it's actually imported from remotion
    if (!sourceCode.includes("from 'remotion'") && !sourceCode.includes('from "remotion"')) {
      return sourceCode;
    }

    // Check if staticFile is in the import
    const remotionImportMatch = sourceCode.match(/import\s*\{([^}]+)\}\s*from\s*['"]remotion['"]/);
    if (remotionImportMatch) {
      const imports = remotionImportMatch[1];
      if (!imports.includes('staticFile')) {
        // Add staticFile to existing import
        const newImports = imports.trim() + ', staticFile';
        return sourceCode.replace(remotionImportMatch[0], `import {${newImports}} from 'remotion'`);
      }
    }
    return sourceCode;
  }

  // Add staticFile to existing remotion import
  const remotionImportMatch = sourceCode.match(/import\s*\{([^}]+)\}\s*from\s*['"]remotion['"]/);
  if (remotionImportMatch) {
    const imports = remotionImportMatch[1];
    const newImports = imports.trim() + ', staticFile';
    return sourceCode.replace(remotionImportMatch[0], `import {${newImports}} from 'remotion'`);
  }

  // No remotion import found, add one at the top
  return `import { staticFile } from 'remotion';\n${sourceCode}`;
}

function generateEntryPoint(componentPath: string, videoConfig: VideoConfig): string {
  return `import { registerRoot } from 'remotion';
import { Composition } from 'remotion';
import MyAnimation from './Component';

const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="ExportComp"
        component={MyAnimation}
        durationInFrames={${videoConfig.durationInFrames}}
        fps={${videoConfig.fps}}
        width={${videoConfig.width}}
        height={${videoConfig.height}}
      />
    </>
  );
};

registerRoot(Root);
`;
}

function parseProgress(line: string): number | null {
  // Remotion outputs: "Rendered X of Y frames (Z%)"
  const match = line.match(/\((\d+(?:\.\d+)?)%\)/);
  if (match) {
    return parseFloat(match[1]);
  }
  return null;
}

async function runRender(
  jobId: string,
  sourceCode: string,
  videoConfig: VideoConfig,
  options: ExportOptions
): Promise<void> {
  const job = jobs.get(jobId);
  if (!job) return;

  job.status = 'rendering';
  job.startedAt = new Date();

  const jobDir = path.join(TEMP_DIR, jobId);

  try {
    await ensureDir(jobDir);
    await ensureDir(OUTPUT_DIR);

    // Transform asset paths from URLs to staticFile() calls
    const { code: transformedCode, hasAssets } = transformAssetPaths(sourceCode);

    // Ensure staticFile is imported if assets are used
    const finalSource = hasAssets ? ensureStaticFileImport(transformedCode) : transformedCode;

    // Write component source
    const componentPath = path.join(jobDir, 'Component.tsx');
    await fs.writeFile(componentPath, finalSource, 'utf-8');

    if (hasAssets) {
      console.log(`[Render ${jobId}] Transformed asset paths to use staticFile()`);
    }

    // Generate entry point
    const entryPath = path.join(jobDir, 'render-entry.tsx');
    const entryCode = generateEntryPoint('./Component', videoConfig);
    await fs.writeFile(entryPath, entryCode, 'utf-8');

    // Determine output file
    const extension = getExtension(options.codec);
    const outputPath = path.join(OUTPUT_DIR, `${jobId}${extension}`);

    // Build remotion render command args
    const args = [
      'render',
      entryPath,
      'ExportComp',
      outputPath,
      '--codec', options.codec,
      '--public-dir', PUBLIC_DIR,
    ];

    // Add CRF if applicable
    if (options.codec !== 'prores') {
      const crf = options.crf ?? getDefaultCrf(options.codec);
      if (crf !== null && isValidCrf(options.codec, crf)) {
        args.push('--crf', String(crf));
      }
    }

    // Add audio codec
    const audioCodec = options.audioCodec ?? getDefaultAudioCodec(options.codec);
    if (isValidAudioCodec(options.codec, audioCodec)) {
      args.push('--audio-codec', audioCodec);
    }

    // Add ProRes profile if applicable
    if (options.codec === 'prores') {
      const profile = options.proresProfile ?? DEFAULT_PRORES_PROFILE;
      args.push('--prores-profile', profile);
    }

    console.log(`[Render ${jobId}] Starting render with args:`, args.join(' '));

    await new Promise<void>((resolve) => {
      const remotion = spawn('npx', ['remotion', ...args], {
        cwd: process.cwd(),
        env: { ...process.env },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      remotion.stdout.on('data', (data) => {
        const line = data.toString();
        console.log(`[Render ${jobId}] stdout:`, line.trim());
      });

      remotion.stderr.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          console.log(`[Render ${jobId}] stderr:`, line.trim());

          const progress = parseProgress(line);
          if (progress !== null) {
            job.progress = progress;
          }
        }
      });

      remotion.on('close', async (code) => {
        job.completedAt = new Date();

        if (code === 0) {
          // Verify output file exists
          try {
            await fs.access(outputPath);
            job.status = 'complete';
            job.progress = 100;
            job.outputPath = `/assets/renders/${jobId}${extension}`;
            console.log(`[Render ${jobId}] SUCCESS - Output: ${job.outputPath}`);
          } catch {
            job.status = 'failed';
            job.error = 'Render completed but output file not found';
            console.error(`[Render ${jobId}] FAILED: Output file not found`);
          }
        } else {
          job.status = 'failed';
          job.error = `Render process exited with code ${code}`;
          console.error(`[Render ${jobId}] FAILED: Exit code ${code}`);
        }

        // Cleanup temp files
        await cleanupTempDir(jobId);
        resolve();
      });

      remotion.on('error', async (err) => {
        job.completedAt = new Date();
        job.status = 'failed';
        job.error = err.message;
        console.error(`[Render ${jobId}] SPAWN ERROR:`, err.message);
        await cleanupTempDir(jobId);
        resolve();
      });
    });
  } catch (err) {
    job.completedAt = new Date();
    job.status = 'failed';
    job.error = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Render ${jobId}] ERROR:`, job.error);
    await cleanupTempDir(jobId);
  }
}

export function startRender(
  componentId: string,
  sourceCode: string,
  videoConfig: VideoConfig,
  options: ExportOptions
): string {
  const jobId = uuid();

  jobs.set(jobId, {
    id: jobId,
    componentId,
    status: 'queued',
    progress: 0,
  });

  // Start render in background
  setImmediate(() => runRender(jobId, sourceCode, videoConfig, options));

  return jobId;
}

export function getRenderStatus(jobId: string): RenderJob | undefined {
  return jobs.get(jobId);
}

export function deleteRenderJob(jobId: string): boolean {
  return jobs.delete(jobId);
}

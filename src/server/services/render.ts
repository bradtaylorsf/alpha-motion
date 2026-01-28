import { spawn } from 'child_process';
import { v4 as uuid } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import {
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

// Get directories based on environment (Electron vs development)
function getTempDir(): string {
  if (process.env.ELECTRON_DB_PATH) {
    const userDataDir = path.dirname(process.env.ELECTRON_DB_PATH);
    return path.join(userDataDir, '.remotion-render');
  }
  return path.resolve(process.cwd(), '.remotion-render');
}

function getOutputDir(): string {
  if (process.env.ELECTRON_DB_PATH) {
    const userDataDir = path.dirname(process.env.ELECTRON_DB_PATH);
    return path.join(userDataDir, 'renders');
  }
  return path.resolve(process.cwd(), 'public/assets/renders');
}

function getPublicDir(): string {
  if (process.env.ELECTRON_DB_PATH) {
    // In Electron, return userData as the public root
    return path.dirname(process.env.ELECTRON_DB_PATH);
  }
  return path.resolve(process.cwd(), 'public');
}

function getOutputPathPrefix(): string {
  return '/assets/renders';
}

// Get a safe working directory for spawning processes (for temp files)
function getSafeWorkingDir(): string {
  if (process.env.ELECTRON_DB_PATH) {
    return path.dirname(process.env.ELECTRON_DB_PATH);
  }
  return process.cwd();
}

// Get the app root directory where node_modules with Remotion is installed
// This is needed for npx to find the remotion package
function getAppRootDir(): string {
  if (process.env.ELECTRON_APP_ROOT) {
    // ELECTRON_APP_ROOT points to dist/, we need to go up to the app root
    return path.join(process.env.ELECTRON_APP_ROOT, '..');
  }
  return process.cwd();
}

// Find node executable in common paths (for Electron where PATH is limited)
function findNodePath(): string {
  if (process.env.ELECTRON_DB_PATH) {
    const home = os.homedir();
    const commonPaths = [
      '/usr/local/bin/node',
      '/opt/homebrew/bin/node',
      path.join(home, '.nvm/versions/node', 'current', 'bin', 'node'),
      path.join(home, '.local/bin/node'),
      '/usr/bin/node',
    ];

    const fs = require('fs');
    for (const nodePath of commonPaths) {
      try {
        fs.accessSync(nodePath, fs.constants.X_OK);
        return nodePath;
      } catch {
        // Not found, try next
      }
    }

    // Fall back to process.execPath (Electron's node)
    return process.execPath;
  }
  return 'node';
}

// Get the path to the remotion CLI
function getRemotionCliPath(): string {
  const appRoot = getAppRootDir();
  return path.join(appRoot, 'node_modules', '@remotion', 'cli', 'remotion-cli.js');
}

const TEMP_DIR = getTempDir();
const OUTPUT_DIR = getOutputDir();
const PUBLIC_DIR = getPublicDir();

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
    (_match, _quote, assetPath) => {
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
    if (remotionImportMatch && remotionImportMatch[1]) {
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
  if (remotionImportMatch && remotionImportMatch[1]) {
    const imports = remotionImportMatch[1];
    const newImports = imports.trim() + ', staticFile';
    return sourceCode.replace(remotionImportMatch[0], `import {${newImports}} from 'remotion'`);
  }

  // No remotion import found, add one at the top
  return `import { staticFile } from 'remotion';\n${sourceCode}`;
}

function generateEntryPoint(_componentPath: string, videoConfig: VideoConfig): string {
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

// Strip ANSI escape codes from string
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '');
}

function parseProgress(line: string): number | null {
  // Strip ANSI codes that might interfere with parsing
  const cleanLine = stripAnsi(line);

  // Remotion outputs progress in various formats:
  // - "Bundling 6%"
  // - "Rendered 1/150, time remaining: 26s"
  // - "Rendered X of Y frames (Z%)"
  // - "Encoded 150/150"

  // Try "X/Y" pattern (e.g., "Rendered 1/150" or "Encoded 50/150")
  let match = cleanLine.match(/(?:Rendered|Encoded)\s+(\d+)\/(\d+)/i);
  if (match && match[1] && match[2]) {
    const current = parseInt(match[1], 10);
    const total = parseInt(match[2], 10);
    if (total > 0) {
      return Math.round((current / total) * 100);
    }
  }

  // Try pattern with parentheses: (Z%)
  match = cleanLine.match(/\((\d+(?:\.\d+)?)%\)/);
  if (match && match[1]) {
    return parseFloat(match[1]);
  }

  // Try pattern without parentheses: Z% (e.g., "Bundling 6%")
  match = cleanLine.match(/(\d+(?:\.\d+)?)%/);
  if (match && match[1]) {
    return parseFloat(match[1]);
  }

  // Try "X of Y frames" pattern
  match = cleanLine.match(/(\d+)\s+of\s+(\d+)\s+frames/i);
  if (match && match[1] && match[2]) {
    const current = parseInt(match[1], 10);
    const total = parseInt(match[2], 10);
    if (total > 0) {
      return Math.round((current / total) * 100);
    }
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
      // Build the command to run remotion CLI
      const nodePath = findNodePath();
      const remotionCliPath = getRemotionCliPath();
      const fullCommand = `"${nodePath}" "${remotionCliPath}" ${args.map(a => `"${a}"`).join(' ')}`;

      console.log(`[Render ${jobId}] Running command: ${fullCommand}`);

      // Use app root directory as cwd so npx can find remotion in node_modules
      const cwd = getAppRootDir();
      console.log(`[Render ${jobId}] Working directory: ${cwd}`);

      const remotion = spawn('/bin/bash', ['-c', fullCommand], {
        cwd,
        env: { ...process.env },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      remotion.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          console.log(`[Render ${jobId}] stdout:`, line.trim());

          // Parse progress from stdout (Remotion outputs progress here)
          const progress = parseProgress(line);
          if (progress !== null) {
            job.progress = progress;
            console.log(`[Render ${jobId}] Progress updated: ${progress}%`);
          }
        }
      });

      let stderrOutput = '';
      remotion.stderr.on('data', (data) => {
        const text = data.toString();
        stderrOutput += text;
        const lines = text.split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          console.log(`[Render ${jobId}] stderr:`, line.trim());

          // Also check stderr for progress (some versions output here)
          const progress = parseProgress(line);
          if (progress !== null) {
            job.progress = progress;
            console.log(`[Render ${jobId}] Progress updated: ${progress}%`);
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
            job.outputPath = `${getOutputPathPrefix()}/${jobId}${extension}`;
            console.log(`[Render ${jobId}] SUCCESS - Output: ${job.outputPath}`);
          } catch {
            job.status = 'failed';
            job.error = 'Render completed but output file not found';
            console.error(`[Render ${jobId}] FAILED: Output file not found`);
          }
        } else {
          job.status = 'failed';
          // Include stderr output in error message for debugging
          const errorDetails = stderrOutput.trim().slice(-500); // Last 500 chars
          job.error = `Render process exited with code ${code}. ${errorDetails}`;
          console.error(`[Render ${jobId}] FAILED: Exit code ${code}`);
          console.error(`[Render ${jobId}] stderr: ${stderrOutput}`);

          // Also log to error file for Electron debugging
          if (process.env.ELECTRON_DB_PATH) {
            const errorLogPath = path.join(path.dirname(process.env.ELECTRON_DB_PATH), 'error.log');
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] Render ${jobId} failed with code ${code}\nCommand: ${fullCommand}\nCWD: ${cwd}\nstderr: ${stderrOutput}\n\n`;
            require('fs').appendFileSync(errorLogPath, logMessage);
          }
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

import { spawn } from 'child_process';
import { v4 as uuid } from 'uuid';
import type { AnimationIdea } from './anthropic';

export interface AssetInfo {
  url: string;
  prompt: string;
  id: string;
  type?: 'background' | 'icon' | 'texture' | 'character' | 'object' | 'other';
}

export interface GenerationOptions {
  durationFrames?: number;
  fps?: number;
  width?: number;
  height?: number;
  assets?: AssetInfo[];
  assetIds?: string[]; // For linking after component creation
}

export interface GenerationJob {
  id: string;
  status: 'queued' | 'generating' | 'complete' | 'failed';
  idea: AnimationIdea;
  options?: GenerationOptions;
  result?: string;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

const jobs = new Map<string, GenerationJob>();

function inferAssetType(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes('background') || lower.includes('backdrop') || lower.includes('scene')) return 'background';
  if (lower.includes('icon') || lower.includes('logo') || lower.includes('symbol')) return 'icon';
  if (lower.includes('texture') || lower.includes('pattern') || lower.includes('overlay')) return 'texture';
  if (lower.includes('character') || lower.includes('person') || lower.includes('avatar')) return 'character';
  return 'object';
}

function buildComponentPrompt(idea: AnimationIdea, options?: GenerationOptions): string {
  const assets = options?.assets || [];
  const hasAssets = assets.length > 0;

  let assetSection = '';
  if (hasAssets) {
    const assetList = assets.map((a, i) => {
      const type = a.type || inferAssetType(a.prompt);
      return `  ${i + 1}. ${type.toUpperCase()}: "${a.prompt}"
     URL: ${a.url}
     Suggested use: ${getSuggestedUse(type)}`;
    }).join('\n\n');

    assetSection = `
## IMPORTANT: Available Image Assets (YOU MUST USE ALL OF THESE)
The user has specifically generated ${assets.length} image asset(s) for this animation.
**You MUST incorporate ALL of the following assets into your component:**

${assetList}

### How to use assets:
\`\`\`tsx
import { Img } from 'remotion';

// Define asset URLs as constants at the top
${assets.map((a, i) => `const ASSET_${i + 1} = '${a.url}';`).join('\n')}

// Use in your component with appropriate styling:
<Img src={ASSET_1} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
\`\`\`

### Asset integration requirements:
- Each asset MUST appear in the final animation
- Animate assets using Remotion's interpolate/spring functions
- Position and size assets appropriately for their type (backgrounds fill, icons are smaller, etc.)
- Layer assets logically (backgrounds behind, objects/icons in front)
`;
  }

  return `Generate a Remotion component for this animation concept:

## Animation Concept
Title: ${idea.title}
Description: ${idea.description}
Style: ${idea.style}
Colors: ${idea.colors.join(', ')}
Motion: ${idea.motion}
Duration: ${idea.duration}
Elements: ${idea.elements.join(', ')}
${assetSection}
## Requirements
1. Export a React component named "MyAnimation" as the default export
2. Define ALL customizable values (colors, text, sizes, timing) as NAMED CONSTANTS at the top
3. The component must be self-contained and work immediately
${hasAssets ? `4. CRITICAL: You MUST use ALL ${assets.length} provided image assets - import { Img } from "remotion"` : '4. Do NOT import external images or assets'}

## Output
Return ONLY the TypeScript/TSX code. No explanations, no markdown code blocks, just the raw code starting with import statements.`;
}

function getSuggestedUse(type: string): string {
  switch (type) {
    case 'background': return 'Full-screen or section background with cover/contain fit';
    case 'icon': return 'Small decorative element, typically 48-128px, animated entrance';
    case 'texture': return 'Overlay or pattern, possibly with blend mode or opacity animation';
    case 'character': return 'Main visual element, centered or positioned with scale/position animation';
    default: return 'Visual element with appropriate positioning and animation';
  }
}

function extractCode(output: string): string {
  // Remove any markdown code blocks if present
  let code = output.replace(/```(?:tsx?|javascript|jsx)?\n?/g, '').replace(/```$/g, '');

  // Find the first import statement
  const importIndex = code.indexOf('import');
  if (importIndex > 0) {
    code = code.slice(importIndex);
  }

  // Remove any trailing explanation text after the component
  const exportDefaultIndex = code.lastIndexOf('export default');
  if (exportDefaultIndex !== -1) {
    const semicolonAfterExport = code.indexOf(';', exportDefaultIndex);
    if (semicolonAfterExport !== -1) {
      code = code.slice(0, semicolonAfterExport + 1);
    }
  }

  return code.trim();
}

async function runGeneration(jobId: string): Promise<void> {
  const job = jobs.get(jobId);
  if (!job) return;

  job.status = 'generating';
  job.startedAt = new Date();

  const prompt = buildComponentPrompt(job.idea, job.options);

  const claudePath = process.env.CLAUDE_PATH || '/Users/bradtaylor/.local/bin/claude';
  console.log(`[Generation ${jobId}] Starting generation for: ${job.idea.title}`);
  console.log(`[Generation ${jobId}] Running claude CLI at: ${claudePath}`);

  return new Promise<void>((resolve) => {
    // Use full path to claude CLI and bash to ensure proper environment
    const claude = spawn('/bin/bash', ['-c', `"${claudePath}" --print --output-format text`], {
      cwd: process.cwd(),
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let output = '';
    let error = '';

    // Write prompt to stdin
    claude.stdin.write(prompt);
    claude.stdin.end();

    claude.stdout.on('data', (data) => {
      output += data.toString();
      console.log(`[Generation ${jobId}] Received ${data.length} bytes of output`);
    });

    claude.stderr.on('data', (data) => {
      error += data.toString();
      console.log(`[Generation ${jobId}] stderr: ${data.toString()}`);
    });

    claude.on('close', (code) => {
      job.completedAt = new Date();
      console.log(`[Generation ${jobId}] Process exited with code: ${code}`);

      if (code === 0 && output.trim()) {
        job.status = 'complete';
        job.result = extractCode(output);
        console.log(`[Generation ${jobId}] SUCCESS - Generated ${job.result.length} chars of code`);
      } else {
        job.status = 'failed';
        job.error = error || 'Generation failed - no output received';
        console.log(`[Generation ${jobId}] FAILED: ${job.error}`);
      }
      resolve();
    });

    claude.on('error', (err) => {
      job.completedAt = new Date();
      job.status = 'failed';
      job.error = err.message;
      console.log(`[Generation ${jobId}] SPAWN ERROR: ${err.message}`);
      resolve();
    });
  });
}

export function startGeneration(idea: AnimationIdea, options?: GenerationOptions): string {
  const jobId = uuid();

  jobs.set(jobId, {
    id: jobId,
    status: 'queued',
    idea,
    options,
  });

  // Start generation in background
  setImmediate(() => runGeneration(jobId));

  return jobId;
}

export function getJobStatus(jobId: string): GenerationJob | undefined {
  return jobs.get(jobId);
}

export function deleteJob(jobId: string): boolean {
  return jobs.delete(jobId);
}

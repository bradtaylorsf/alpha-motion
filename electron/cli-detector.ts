import which from 'which';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export interface ClaudeCliStatus {
  found: boolean;
  path?: string;
  version?: string;
  error?: string;
}

// Common paths where Claude CLI might be installed
function getCommonClaudePaths(): string[] {
  const home = os.homedir();
  return [
    '/usr/local/bin/claude',
    '/opt/homebrew/bin/claude', // Apple Silicon Homebrew
    path.join(home, '.local', 'bin', 'claude'),
    path.join(home, '.claude', 'bin', 'claude'),
    path.join(home, '.nvm', 'versions', 'node', 'current', 'bin', 'claude'),
    '/usr/bin/claude',
  ];
}

/**
 * Check if a file exists and is executable
 */
function isExecutable(filePath: string): boolean {
  try {
    fs.accessSync(filePath, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Try to find Claude CLI in common installation paths
 */
function findClaudeInCommonPaths(): string | null {
  for (const claudePath of getCommonClaudePaths()) {
    if (isExecutable(claudePath)) {
      return claudePath;
    }
  }
  return null;
}

/**
 * Detect if Claude CLI is installed and available
 */
export async function detectClaudeCli(): Promise<ClaudeCliStatus> {
  // First, try common installation paths (works even with limited PATH)
  let claudePath = findClaudeInCommonPaths();

  // If not found in common paths, try using which (for custom installations)
  if (!claudePath) {
    try {
      claudePath = await which('claude');
    } catch {
      // Not found in PATH either
    }
  }

  if (!claudePath) {
    return {
      found: false,
      error:
        'Claude CLI not found in PATH. Install it from https://claude.ai/code or ensure it is in your system PATH.',
    };
  }

  // Get version
  try {
    const { stdout } = await execAsync(`"${claudePath}" --version`, {
      timeout: 5000,
    });
    const version = stdout.trim();

    return {
      found: true,
      path: claudePath,
      version,
    };
  } catch {
    // Found claude but couldn't get version
    return {
      found: true,
      path: claudePath,
      error: 'Found Claude CLI but could not determine version',
    };
  }
}

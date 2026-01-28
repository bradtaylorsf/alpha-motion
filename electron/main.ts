import { app, BrowserWindow, dialog } from 'electron';
import { createMainWindow } from './window';
import { registerIpcHandlers } from './ipc-handlers';
import { startEmbeddedServer, stopEmbeddedServer } from './server';
import { detectClaudeCli } from './cli-detector';
import { getCredential, KEY_NAMES } from './keychain';
import fs from 'fs';
import path from 'path';

const isDev = process.env.NODE_ENV === 'development';

let _mainWindow: BrowserWindow | null = null;
let serverPort: number = 3001;

// Log errors to a file for debugging
function logError(message: string, error?: unknown): void {
  const logPath = path.join(app.getPath('userData'), 'error.log');
  const timestamp = new Date().toISOString();
  const errorStr = error instanceof Error ? `${error.message}\n${error.stack}` : String(error);
  const logMessage = `[${timestamp}] ${message}\n${errorStr}\n\n`;

  try {
    fs.appendFileSync(logPath, logMessage);
  } catch {
    // Ignore write errors
  }

  console.error(message, error);
}

async function createWindow(): Promise<void> {
  // Auto-detect Claude CLI and set CLAUDE_PATH for the server
  try {
    const cliStatus = await detectClaudeCli();
    if (cliStatus.found && cliStatus.path) {
      process.env.CLAUDE_PATH = cliStatus.path;
      logError(`Claude CLI found at: ${cliStatus.path}`);
    } else {
      logError('Claude CLI not found in common paths');
    }
  } catch (error) {
    logError('Error detecting Claude CLI', error);
  }

  // Load API keys from keychain and set as environment variables
  try {
    const anthropicKey = await getCredential(KEY_NAMES.ANTHROPIC_API_KEY);
    if (anthropicKey) {
      process.env.ANTHROPIC_API_KEY = anthropicKey;
      logError('Loaded Anthropic API key from keychain');
    }

    const geminiKey = await getCredential(KEY_NAMES.GEMINI_API_KEY);
    if (geminiKey) {
      process.env.GEMINI_API_KEY = geminiKey;
      logError('Loaded Gemini API key from keychain');
    }
  } catch (error) {
    logError('Error loading API keys from keychain', error);
  }

  // Start embedded server (not in dev mode where we use separate processes)
  if (!isDev) {
    try {
      logError('Starting embedded server...', `App path: ${app.getAppPath()}`);
      serverPort = await startEmbeddedServer();
      logError(`Embedded server started on port ${serverPort}`);
    } catch (error) {
      logError('Failed to start embedded server', error);
      dialog.showErrorBox('Startup Error', `Failed to start server: ${error instanceof Error ? error.message : String(error)}`);
      app.quit();
      return;
    }
  }

  // Register IPC handlers
  registerIpcHandlers();

  // Create the browser window
  _mainWindow = createMainWindow({
    serverPort,
    isDev,
  });
}

// Handle macOS activation
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Graceful shutdown
app.on('before-quit', async () => {
  if (!isDev) {
    await stopEmbeddedServer();
  }
});

// App ready
app.whenReady().then(createWindow);

// Security: Disable navigation to arbitrary URLs
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    const allowedOrigins = ['localhost', '127.0.0.1'];

    if (!allowedOrigins.includes(parsedUrl.hostname)) {
      event.preventDefault();
    }
  });
});

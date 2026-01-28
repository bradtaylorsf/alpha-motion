import { ipcMain, app } from 'electron';
import { getCredential, setCredential, deleteCredential, KEY_NAMES } from './keychain';
import { detectClaudeCli } from './cli-detector';

// Map keychain key names to environment variable names
const KEY_TO_ENV: Record<string, string> = {
  [KEY_NAMES.ANTHROPIC_API_KEY]: 'ANTHROPIC_API_KEY',
  [KEY_NAMES.GEMINI_API_KEY]: 'GEMINI_API_KEY',
};

export function registerIpcHandlers(): void {
  // Keychain handlers
  ipcMain.handle('keychain:get', async (_event, keyName: string) => {
    return getCredential(keyName);
  });

  ipcMain.handle('keychain:set', async (_event, keyName: string, value: string) => {
    const result = await setCredential(keyName, value);
    // Also set as environment variable so the server can use it immediately
    if (result && KEY_TO_ENV[keyName]) {
      process.env[KEY_TO_ENV[keyName]] = value;
    }
    return result;
  });

  ipcMain.handle('keychain:delete', async (_event, keyName: string) => {
    const result = await deleteCredential(keyName);
    // Also clear the environment variable
    if (result && KEY_TO_ENV[keyName]) {
      delete process.env[KEY_TO_ENV[keyName]];
    }
    return result;
  });

  // CLI detection handler
  ipcMain.handle('cli:detect-claude', async () => {
    const result = await detectClaudeCli();
    // If CLI is found, set the path as environment variable for the server to use
    if (result.found && result.path) {
      process.env.CLAUDE_PATH = result.path;
    }
    return result;
  });

  // App info handlers
  ipcMain.handle('app:get-version', () => {
    return app.getVersion();
  });

  ipcMain.handle('app:get-paths', () => {
    return {
      userData: app.getPath('userData'),
      temp: app.getPath('temp'),
    };
  });
}

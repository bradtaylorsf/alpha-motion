import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Keychain operations
  keychain: {
    get: (keyName: string): Promise<string | null> =>
      ipcRenderer.invoke('keychain:get', keyName),
    set: (keyName: string, value: string): Promise<boolean> =>
      ipcRenderer.invoke('keychain:set', keyName, value),
    delete: (keyName: string): Promise<boolean> =>
      ipcRenderer.invoke('keychain:delete', keyName),
  },

  // Claude CLI detection
  cli: {
    detectClaude: (): Promise<{
      found: boolean;
      path?: string;
      version?: string;
      error?: string;
    }> => ipcRenderer.invoke('cli:detect-claude'),
  },

  // App info
  app: {
    getVersion: (): Promise<string> => ipcRenderer.invoke('app:get-version'),
    getPaths: (): Promise<{
      userData: string;
      temp: string;
    }> => ipcRenderer.invoke('app:get-paths'),
  },

  // Environment check
  isElectron: true,
});

// Type declarations for the exposed API
declare global {
  interface Window {
    electronAPI?: {
      keychain: {
        get: (keyName: string) => Promise<string | null>;
        set: (keyName: string, value: string) => Promise<boolean>;
        delete: (keyName: string) => Promise<boolean>;
      };
      cli: {
        detectClaude: () => Promise<{
          found: boolean;
          path?: string;
          version?: string;
          error?: string;
        }>;
      };
      app: {
        getVersion: () => Promise<string>;
        getPaths: () => Promise<{
          userData: string;
          temp: string;
        }>;
      };
      isElectron: true;
    };
  }
}

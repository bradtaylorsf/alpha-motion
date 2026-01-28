// Type declarations for the Electron API exposed via preload script

export interface ElectronAPI {
  keychain: {
    get: (keyName: string) => Promise<string | null>;
    set: (keyName: string, value: string) => Promise<boolean>;
    delete: (keyName: string) => Promise<boolean>;
  };
  cli: {
    detectClaude: () => Promise<ClaudeCliStatus>;
  };
  app: {
    getVersion: () => Promise<string>;
    getPaths: () => Promise<AppPaths>;
  };
  isElectron: true;
}

export interface ClaudeCliStatus {
  found: boolean;
  path?: string;
  version?: string;
  error?: string;
}

export interface AppPaths {
  userData: string;
  temp: string;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};

import { useCallback, useEffect, useState } from 'react';
import type { ClaudeCliStatus, AppPaths } from '../types/electron';

// Key names matching electron/keychain.ts
export const KEY_NAMES = {
  ANTHROPIC_API_KEY: 'anthropic-api-key',
  GEMINI_API_KEY: 'gemini-api-key',
} as const;

/**
 * Check if running in Electron environment
 */
export function isElectron(): boolean {
  return typeof window !== 'undefined' && !!window.electronAPI?.isElectron;
}

/**
 * Hook for accessing Electron APIs
 */
export function useElectron() {
  const electron = isElectron();

  // Keychain operations
  const getApiKey = useCallback(async (keyName: string): Promise<string | null> => {
    if (!isElectron()) return null;
    return window.electronAPI!.keychain.get(keyName);
  }, []);

  const setApiKey = useCallback(async (keyName: string, value: string): Promise<boolean> => {
    if (!isElectron()) return false;
    return window.electronAPI!.keychain.set(keyName, value);
  }, []);

  const deleteApiKey = useCallback(async (keyName: string): Promise<boolean> => {
    if (!isElectron()) return false;
    return window.electronAPI!.keychain.delete(keyName);
  }, []);

  // Claude CLI detection
  const detectClaudeCli = useCallback(async (): Promise<ClaudeCliStatus | null> => {
    if (!isElectron()) return null;
    return window.electronAPI!.cli.detectClaude();
  }, []);

  // App info
  const getAppVersion = useCallback(async (): Promise<string | null> => {
    if (!isElectron()) return null;
    return window.electronAPI!.app.getVersion();
  }, []);

  const getAppPaths = useCallback(async (): Promise<AppPaths | null> => {
    if (!isElectron()) return null;
    return window.electronAPI!.app.getPaths();
  }, []);

  return {
    isElectron: electron,
    getApiKey,
    setApiKey,
    deleteApiKey,
    detectClaudeCli,
    getAppVersion,
    getAppPaths,
  };
}

/**
 * Hook for managing a specific API key
 */
export function useApiKey(keyName: string) {
  const { isElectron, getApiKey, setApiKey, deleteApiKey } = useElectron();
  const [value, setValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial value
  useEffect(() => {
    if (!isElectron) {
      setLoading(false);
      return;
    }

    getApiKey(keyName)
      .then((key) => {
        setValue(key);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [isElectron, keyName, getApiKey]);

  const save = useCallback(
    async (newValue: string): Promise<boolean> => {
      if (!isElectron) return false;

      setError(null);
      try {
        const success = await setApiKey(keyName, newValue);
        if (success) {
          setValue(newValue);
        } else {
          setError('Failed to save API key');
        }
        return success;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        return false;
      }
    },
    [isElectron, keyName, setApiKey]
  );

  const remove = useCallback(async (): Promise<boolean> => {
    if (!isElectron) return false;

    setError(null);
    try {
      const success = await deleteApiKey(keyName);
      if (success) {
        setValue(null);
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, [isElectron, keyName, deleteApiKey]);

  // Check if key is set (without exposing value)
  const hasKey = value !== null && value.length > 0;

  return {
    value,
    hasKey,
    loading,
    error,
    save,
    remove,
    isElectron,
  };
}

/**
 * Hook for Claude CLI status
 */
export function useClaudeCli() {
  const { isElectron, detectClaudeCli } = useElectron();
  const [status, setStatus] = useState<ClaudeCliStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isElectron) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const result = await detectClaudeCli();
    setStatus(result);
    setLoading(false);
  }, [isElectron, detectClaudeCli]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    status,
    loading,
    refresh,
    isElectron,
  };
}

import { useState, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { useApiKey, useClaudeCli, useElectron, KEY_NAMES } from '../hooks/useElectron';

function ApiKeyInput({
  label,
  description,
  keyName,
  placeholder,
}: {
  label: string;
  description: string;
  keyName: string;
  placeholder: string;
}) {
  const { value, hasKey, loading, error, save, remove, isElectron } = useApiKey(keyName);
  const [inputValue, setInputValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Update input when value loads
  useEffect(() => {
    if (value) {
      // Show masked value
      setInputValue('••••••••••••••••');
    }
  }, [value]);

  const handleSave = async () => {
    if (!inputValue || inputValue === '••••••••••••••••') return;

    setSaving(true);
    const success = await save(inputValue);
    setSaving(false);

    if (success) {
      setShowSuccess(true);
      setInputValue('••••••••••••••••');
      setTimeout(() => setShowSuccess(false), 2000);
    }
  };

  const handleRemove = async () => {
    setSaving(true);
    await remove();
    setSaving(false);
    setInputValue('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowSuccess(false);
  };

  const handleFocus = () => {
    // Clear masked value on focus if key exists
    if (inputValue === '••••••••••••••••') {
      setInputValue('');
    }
  };

  if (!isElectron) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="text-sm text-muted-foreground">
          API key management is only available in the desktop app.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {hasKey && (
          <span className="flex items-center gap-1 text-xs text-green-500">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Configured
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>

      <div className="flex gap-2">
        <input
          type="password"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={loading ? 'Loading...' : placeholder}
          disabled={loading || saving}
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
        />
        <button
          onClick={handleSave}
          disabled={loading || saving || !inputValue || inputValue === '••••••••••••••••'}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        {hasKey && (
          <button
            onClick={handleRemove}
            disabled={loading || saving}
            className="rounded-md border border-destructive px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            Remove
          </button>
        )}
      </div>

      {showSuccess && <p className="text-xs text-green-500">API key saved successfully!</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function ClaudeCliStatus() {
  const { status, loading, refresh, isElectron } = useClaudeCli();

  if (!isElectron) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Claude CLI</h3>
        <button
          onClick={refresh}
          disabled={loading}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {loading ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Detecting Claude CLI...
        </div>
      ) : status?.found ? (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3">
          <div className="flex items-center gap-2 text-sm text-green-500">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Claude CLI Found
          </div>
          {status.version && (
            <p className="mt-1 text-xs text-muted-foreground">Version: {status.version}</p>
          )}
          {status.path && <p className="text-xs text-muted-foreground">Path: {status.path}</p>}
        </div>
      ) : (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <div className="flex items-center gap-2 text-sm text-amber-500">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Claude CLI Not Found
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {status?.error || 'Install Claude CLI to enable component generation.'}
          </p>
          <a
            href="https://claude.ai/code"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-xs text-primary hover:underline"
          >
            Get Claude CLI
          </a>
        </div>
      )}
    </div>
  );
}

function AppInfo() {
  const { isElectron, getAppVersion, getAppPaths } = useElectron();
  const [version, setVersion] = useState<string | null>(null);
  const [paths, setPaths] = useState<{ userData: string; temp: string } | null>(null);

  useEffect(() => {
    if (isElectron) {
      getAppVersion().then(setVersion);
      getAppPaths().then(setPaths);
    }
  }, [isElectron, getAppVersion, getAppPaths]);

  if (!isElectron) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">
          Running in web mode. Some features require the desktop app.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">App Version</span>
        <span className="text-foreground">{version || 'Loading...'}</span>
      </div>
      {paths && (
        <>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Data Directory</span>
            <span className="font-mono text-xs text-foreground">{paths.userData}</span>
          </div>
        </>
      )}
    </div>
  );
}

export function Settings() {
  return (
    <div className="flex h-screen flex-col bg-background">
      <Header
        showBackButton
        title="Settings"
        subtitle="Configure API keys and preferences"
      />

      <main className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl space-y-8">
          {/* API Keys Section */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">API Keys</h2>
            <p className="text-sm text-muted-foreground">
              Your API keys are stored securely in your system keychain (macOS Keychain, Windows
              Credential Manager, or Linux Secret Service).
            </p>

            <div className="space-y-6 rounded-lg border border-border p-4">
              <ApiKeyInput
                label="Anthropic API Key"
                description="Required for generating animation ideas. Get your key at console.anthropic.com"
                keyName={KEY_NAMES.ANTHROPIC_API_KEY}
                placeholder="sk-ant-..."
              />

              <div className="border-t border-border" />

              <ApiKeyInput
                label="Google Gemini API Key"
                description="Required for generating images. Get your key at aistudio.google.com"
                keyName={KEY_NAMES.GEMINI_API_KEY}
                placeholder="AIza..."
              />
            </div>
          </section>

          {/* Claude CLI Section */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Component Generation</h2>
            <p className="text-sm text-muted-foreground">
              Component generation uses your local Claude CLI installation.
            </p>

            <div className="rounded-lg border border-border p-4">
              <ClaudeCliStatus />
            </div>
          </section>

          {/* App Info Section */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Application</h2>

            <div className="rounded-lg border border-border p-4">
              <AppInfo />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Settings;

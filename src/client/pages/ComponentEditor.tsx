import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { Header } from '../components/layout/Header';
import { CodePane } from '../components/editor/CodePane';
import { PreviewPane } from '../components/editor/PreviewPane';
import { DetailsPanel } from '../components/editor/DetailsPanel';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useAssets } from '../hooks/useAssets';
import { getComponent, updateComponent } from '../lib/api';
import type { Component } from '../types';

export function ComponentEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [component, setComponent] = useState<Component | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Code editing state
  const [code, setCode] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Debounce code for preview (300ms delay)
  const debouncedCode = useDebouncedValue(code, 300);

  // Assets
  const {
    assets,
    loading: assetsLoading,
    generating: assetsGenerating,
    generateAsset,
    deleteAsset,
  } = useAssets(id);

  // Load component
  useEffect(() => {
    async function load() {
      if (!id) {
        setError('No component ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const comp = await getComponent(id);
        setComponent(comp);
        setCode(comp.sourceCode || '');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load component');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // Track unsaved changes
  useEffect(() => {
    if (component && code !== component.sourceCode) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [code, component]);

  // Warn on navigation with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Save handler
  const handleSave = useCallback(async () => {
    if (!component || !id) return;

    try {
      setSaving(true);
      setSaveError(null);
      const updated = await updateComponent(id, { sourceCode: code });
      setComponent(updated);
      setHasUnsavedChanges(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [id, code, component]);

  // Settings change handler
  const handleSettingsChange = useCallback(async (settings: Partial<Pick<Component, 'durationFrames' | 'fps' | 'width' | 'height'>>) => {
    if (!component || !id) return;

    try {
      const updated = await updateComponent(id, settings);
      setComponent(updated);
    } catch (e) {
      console.error('Failed to update settings:', e);
    }
  }, [id, component]);

  // Asset handlers
  const handleGenerateAsset = useCallback((prompt: string) => {
    if (id) {
      generateAsset(prompt, { componentId: id });
    }
  }, [id, generateAsset]);

  const handleDeleteAsset = useCallback((assetId: string) => {
    deleteAsset(assetId);
  }, [deleteAsset]);

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <Header showBackButton />
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error || !component) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <Header showBackButton />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-destructive">{error || 'Component not found'}</p>
            <button
              onClick={() => navigate('/')}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Return to board
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <Header
        showBackButton
        title={component.name}
        actions={
          <div className="flex items-center gap-2">
            {saveError && (
              <span className="text-sm text-destructive">{saveError}</span>
            )}
            {hasUnsavedChanges && (
              <span className="text-sm text-muted-foreground">Unsaved changes</span>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !hasUnsavedChanges}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save
                </>
              )}
            </button>
          </div>
        }
      />

      {/* Main content */}
      <div className="flex-1 min-h-0">
        <PanelGroup direction="horizontal">
          {/* Code editor panel */}
          <Panel defaultSize={50} minSize={30}>
            <CodePane
              code={code}
              onChange={setCode}
              onSave={handleSave}
            />
          </Panel>

          {/* Resize handle */}
          <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors cursor-col-resize" />

          {/* Preview panel */}
          <Panel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col">
              {/* Preview area */}
              <div className="flex-1 min-h-0">
                <PreviewPane
                  sourceCode={debouncedCode}
                  width={component.width}
                  height={component.height}
                  fps={component.fps}
                  durationInFrames={component.durationFrames}
                />
              </div>

              {/* Details panel */}
              <DetailsPanel
                component={component}
                assets={assets}
                assetsLoading={assetsLoading}
                assetsGenerating={assetsGenerating}
                onSettingsChange={handleSettingsChange}
                onGenerateAsset={handleGenerateAsset}
                onDeleteAsset={handleDeleteAsset}
              />
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

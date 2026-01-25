import { useState, useEffect } from 'react';
import { RemotionPreview } from './RemotionPreview';
import { CodeViewer } from './CodeViewer';
import { getComponentSource } from '../../lib/api';
import type { Component } from '../../types';
import { cn, parseTags } from '../../lib/utils';
import { useAssets } from '../../hooks/useAssets';
import { AssetGenerator } from '../assets/AssetGenerator';
import { AssetLibrary } from '../assets/AssetLibrary';

interface PreviewModalProps {
  component: Component;
  onClose: () => void;
  onRemix?: () => void;
}

export function PreviewModal({ component, onClose, onRemix }: PreviewModalProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'assets'>('preview');
  const [sourceCode, setSourceCode] = useState<string | null>(null);
  const [loadingSource, setLoadingSource] = useState(false);

  // Assets for this component
  const {
    assets,
    loading: assetsLoading,
    generating: assetsGenerating,
    error: assetsError,
    generateAsset,
    generateFromSuggestions,
    deleteAsset,
  } = useAssets(component.id);

  // Get suggested assets from the idea
  const suggestedAssets = component.ideaJson?.suggestedAssets || [];

  useEffect(() => {
    async function loadSource() {
      if (component.sourceCode) {
        setSourceCode(component.sourceCode);
      } else {
        setLoadingSource(true);
        try {
          const source = await getComponentSource(component.id);
          setSourceCode(source);
        } catch (e) {
          console.error('Failed to load source:', e);
        } finally {
          setLoadingSource(false);
        }
      }
    }
    loadSource();
  }, [component]);

  // Close on escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-lg border border-border bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{component.name}</h2>
            {component.description && (
              <p className="text-sm text-muted-foreground">{component.description}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            {/* Tabs */}
            <div className="flex rounded-lg border border-border">
              <button
                onClick={() => setActiveTab('preview')}
                className={cn(
                  'px-4 py-2 text-sm font-medium transition-colors',
                  activeTab === 'preview'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Preview
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={cn(
                  'px-4 py-2 text-sm font-medium transition-colors',
                  activeTab === 'code'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Code
              </button>
              <button
                onClick={() => setActiveTab('assets')}
                className={cn(
                  'px-4 py-2 text-sm font-medium transition-colors relative',
                  activeTab === 'assets'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Assets
                {(suggestedAssets.length > 0 || assets.length > 0) && (
                  <span className={cn(
                    'ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 text-xs',
                    activeTab === 'assets'
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}>
                    {assets.length || suggestedAssets.length}
                  </span>
                )}
              </button>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          {activeTab === 'preview' ? (
            <div className="p-6">
              {sourceCode ? (
                <RemotionPreview
                  sourceCode={sourceCode}
                  width={component.width}
                  height={component.height}
                  fps={component.fps}
                  durationInFrames={component.durationFrames}
                />
              ) : loadingSource ? (
                <div className="flex items-center justify-center h-64">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  Failed to load component source
                </div>
              )}
            </div>
          ) : activeTab === 'code' ? (
            <CodeViewer code={sourceCode || ''} loading={loadingSource} />
          ) : (
            <div className="p-6 space-y-6">
              {/* Asset Generator */}
              <AssetGenerator
                suggestedAssets={suggestedAssets}
                generating={assetsGenerating}
                onGenerate={(prompt) => generateAsset(prompt, { componentId: component.id })}
                onGenerateBatch={(prompts) => generateFromSuggestions(prompts, { componentId: component.id })}
                componentId={component.id}
              />

              {/* Divider */}
              {(suggestedAssets.length > 0 || assets.length > 0) && (
                <div className="border-t border-border" />
              )}

              {/* Asset Library */}
              <AssetLibrary
                assets={assets}
                loading={assetsLoading}
                error={assetsError}
                onDelete={deleteAsset}
                emptyMessage="No assets generated yet. Use the suggestions above or enter a custom prompt."
                columns={3}
              />
            </div>
          )}
        </div>

        {/* Footer with metadata */}
        <div className="border-t border-border px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{component.width}x{component.height}</span>
            <span>|</span>
            <span>{component.fps}fps</span>
            <span>|</span>
            <span>{component.durationFrames} frames</span>
            {(() => {
              const tags = parseTags(component.tags);
              return tags.length > 0 && (
                <>
                  <span>|</span>
                  <div className="flex gap-1">
                    {tags.map((tag, i) => (
                      <span key={i} className="rounded bg-secondary px-2 py-0.5 text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>

          {/* Remix button */}
          {onRemix && (
            <button
              onClick={onRemix}
              className="flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Remix
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

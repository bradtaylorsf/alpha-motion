import { useState, useEffect } from 'react';
import { RemotionPreview } from './RemotionPreview';
import { CodeViewer } from './CodeViewer';
import { getComponentSource } from '../../lib/api';
import type { Component } from '../../types';
import { cn } from '../../lib/utils';

interface PreviewModalProps {
  component: Component;
  onClose: () => void;
}

export function PreviewModal({ component, onClose }: PreviewModalProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [sourceCode, setSourceCode] = useState<string | null>(null);
  const [loadingSource, setLoadingSource] = useState(false);

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
          ) : (
            <CodeViewer code={sourceCode || ''} loading={loadingSource} />
          )}
        </div>

        {/* Footer with metadata */}
        <div className="border-t border-border px-6 py-3 flex items-center gap-4 text-sm text-muted-foreground">
          <span>{component.width}x{component.height}</span>
          <span>|</span>
          <span>{component.fps}fps</span>
          <span>|</span>
          <span>{component.durationFrames} frames</span>
          {component.tags.length > 0 && (
            <>
              <span>|</span>
              <div className="flex gap-1">
                {component.tags.map((tag, i) => (
                  <span key={i} className="rounded bg-secondary px-2 py-0.5 text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

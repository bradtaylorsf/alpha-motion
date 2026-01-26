import { useState } from 'react';
import type { Asset } from '../../types';
import { cn } from '../../lib/utils';

interface AssetsTabProps {
  assets: Asset[];
  loading: boolean;
  generating: boolean;
  suggestedAssets: string[];
  onGenerate: (prompt: string) => void;
  onDelete: (id: string) => void;
}

export function AssetsTab({
  assets,
  loading,
  generating,
  suggestedAssets,
  onGenerate,
  onDelete,
}: AssetsTabProps) {
  const [customPrompt, setCustomPrompt] = useState('');

  const handleGenerate = () => {
    if (customPrompt.trim()) {
      onGenerate(customPrompt.trim());
      setCustomPrompt('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Generate new asset */}
      <div className="flex gap-2">
        <input
          type="text"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          placeholder="Describe an asset to generate..."
          disabled={generating}
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <button
          onClick={handleGenerate}
          disabled={generating || !customPrompt.trim()}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {generating ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : (
            'Generate'
          )}
        </button>
      </div>

      {/* Suggested assets */}
      {suggestedAssets.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Suggested:</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestedAssets.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => onGenerate(suggestion)}
                disabled={generating}
                className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Assets grid */}
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : assets.length > 0 ? (
        <div className="grid grid-cols-4 gap-2">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="group relative aspect-square rounded-md overflow-hidden bg-secondary"
            >
              <img
                src={asset.filePath}
                alt={asset.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(asset.filePath);
                  }}
                  className="p-1.5 rounded bg-white/20 hover:bg-white/30 text-white transition-colors"
                  title="Copy path"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={() => onDelete(asset.id)}
                  className="p-1.5 rounded bg-red-500/80 hover:bg-red-500 text-white transition-colors"
                  title="Delete"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No assets yet. Generate one above or use a suggestion.
        </p>
      )}
    </div>
  );
}

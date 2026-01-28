import { useState, useEffect } from 'react';
import type { Asset } from '../../types';

interface EditTabProps {
  componentId: string;
  assets: Asset[];
  isEditing: boolean;
  isRemixing: boolean;
  error: string | null;
  onEdit: (instructions: string) => void;
  onRemix: (instructions: string) => void;
}

export function EditTab({
  componentId: _componentId,
  assets,
  isEditing,
  isRemixing,
  error,
  onEdit,
  onRemix,
}: EditTabProps) {
  const [instructions, setInstructions] = useState('');
  const isProcessing = isEditing || isRemixing;

  // Clear instructions on success
  useEffect(() => {
    if (!isProcessing && !error && instructions) {
      // Keep instructions for potential re-use
    }
  }, [isProcessing, error, instructions]);

  const handleEdit = () => {
    if (!instructions.trim() || isProcessing) return;
    onEdit(instructions.trim());
  };

  const handleRemix = () => {
    if (!instructions.trim() || isProcessing) return;
    onRemix(instructions.trim());
  };

  return (
    <div className="space-y-4">
      {/* Instructions textarea */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Describe your changes
        </label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="e.g., Make the background blue, add a fade-in effect at the start, change the text to 'Hello World'..."
          className="w-full h-24 px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none text-sm"
          disabled={isProcessing}
        />
      </div>

      {/* Assets preview */}
      {assets.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">
            Assets ({assets.length}) - Claude will analyze these images
          </p>
          <div className="flex gap-2 flex-wrap">
            {assets.slice(0, 6).map((asset) => (
              <div
                key={asset.id}
                className="w-12 h-12 rounded border border-border overflow-hidden bg-muted flex-shrink-0"
              >
                <img
                  src={asset.filePath}
                  alt={asset.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {assets.length > 6 && (
              <div className="w-12 h-12 rounded border border-border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                +{assets.length - 6}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="p-2 rounded-md bg-destructive/10 border border-destructive/30">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Processing indicator */}
      {isProcessing && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>{isEditing ? 'Editing component...' : 'Creating remix...'}</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleEdit}
          disabled={!instructions.trim() || isProcessing}
          className="flex-1 flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>
        <button
          onClick={handleRemix}
          disabled={!instructions.trim() || isProcessing}
          className="flex-1 flex items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Create Remix
        </button>
      </div>
    </div>
  );
}

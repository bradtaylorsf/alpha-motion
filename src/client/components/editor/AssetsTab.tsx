import { useState, useRef, useCallback } from 'react';
import type { Asset } from '../../types';
import { cn } from '../../lib/utils';
import { AssetEditModal } from '../assets/AssetEditModal';
import { AssetFullPreviewModal } from '../assets/AssetFullPreviewModal';

interface AssetsTabProps {
  assets: Asset[];
  loading: boolean;
  generating: boolean;
  uploading?: boolean;
  editing?: boolean;
  removingBackground?: boolean;
  suggestedAssets: string[];
  onGenerate: (prompt: string, options?: { transparent?: boolean }) => void;
  onUpload?: (file: File) => Promise<Asset | null>;
  onDelete: (id: string) => void;
  onEdit?: (id: string, editPrompt: string) => Promise<Asset | null>;
  onRemoveBackground?: (id: string) => void;
}

export function AssetsTab({
  assets,
  loading,
  generating,
  uploading = false,
  editing = false,
  removingBackground = false,
  suggestedAssets,
  onGenerate,
  onUpload,
  onDelete,
  onEdit,
  onRemoveBackground,
}: AssetsTabProps) {
  const [customPrompt, setCustomPrompt] = useState('');
  const [transparentBackground, setTransparentBackground] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [previewingAsset, setPreviewingAsset] = useState<Asset | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = () => {
    if (customPrompt.trim()) {
      onGenerate(customPrompt.trim(), { transparent: transparentBackground });
      setCustomPrompt('');
    }
  };

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0 || !onUpload) return;

    // Upload each file
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        onUpload(file);
      }
    });
  }, [onUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const isProcessing = generating || uploading || editing || removingBackground;

  return (
    <div className="space-y-4">
      {/* Generate new asset */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="Describe an asset to generate..."
            disabled={isProcessing}
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          <button
            onClick={handleGenerate}
            disabled={isProcessing || !customPrompt.trim()}
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {generating ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              'Generate'
            )}
          </button>
        </div>

        {/* Transparent background toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={transparentBackground}
            onClick={() => setTransparentBackground(!transparentBackground)}
            disabled={isProcessing}
            className={cn(
              'relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed',
              transparentBackground ? 'bg-primary' : 'bg-muted'
            )}
          >
            <span
              className={cn(
                'pointer-events-none inline-block h-3 w-3 transform rounded-full bg-background shadow ring-0 transition-transform',
                transparentBackground ? 'translate-x-3' : 'translate-x-0'
              )}
            />
          </button>
          <span className="text-xs text-muted-foreground">
            Transparent background (slower)
          </span>
        </div>
      </div>

      {/* Upload area */}
      {onUpload && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={cn(
            'relative rounded-md border-2 border-dashed p-4 text-center transition-colors cursor-pointer',
            isDragging
              ? 'border-primary bg-primary/10'
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-secondary/50',
            isProcessing && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={isProcessing}
          />
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Uploading...
            </div>
          ) : (
            <>
              <svg
                className="mx-auto h-6 w-6 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="mt-1 text-xs text-muted-foreground">
                {isDragging ? 'Drop images here' : 'Click or drag images to upload'}
              </p>
            </>
          )}
        </div>
      )}

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
          {assets.map((asset) => {
            const metadata = asset.metadata as Record<string, unknown> | null;
            const isTransparent = metadata?.transparent === true;

            return (
              <div
                key={asset.id}
                className="group relative aspect-square rounded-md overflow-hidden bg-secondary"
              >
                {/* Checkerboard pattern for transparent images */}
                {isTransparent && (
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                      backgroundSize: '8px 8px',
                      backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                    }}
                  />
                )}
                <img
                  src={asset.filePath}
                  alt={asset.name}
                  className="relative w-full h-full object-cover"
                />
                {/* Transparent badge */}
                {isTransparent && (
                  <div className="absolute top-1 left-1 rounded bg-black/50 px-1 py-0.5 text-[10px] text-white">
                    PNG
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 flex-wrap p-1">
                  {/* Full preview button */}
                  <button
                    onClick={() => setPreviewingAsset(asset)}
                    className="p-1.5 rounded bg-white/20 hover:bg-white/30 text-white transition-colors"
                    title="View full size"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </button>
                  {/* Edit button */}
                  {onEdit && (
                    <button
                      onClick={() => setEditingAsset(asset)}
                      disabled={isProcessing}
                      className="p-1.5 rounded bg-white/20 hover:bg-white/30 text-white transition-colors disabled:opacity-50"
                      title="Edit with AI"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}
                  {/* Remove background button */}
                  {onRemoveBackground && !isTransparent && (
                    <button
                      onClick={() => onRemoveBackground(asset.id)}
                      disabled={isProcessing}
                      className="p-1.5 rounded bg-white/20 hover:bg-white/30 text-white transition-colors disabled:opacity-50"
                      title="Remove background"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                  )}
                  {/* Copy path button */}
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
                  {/* Delete button */}
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
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No assets yet. Generate one above or use a suggestion.
        </p>
      )}

      {/* Edit modal */}
      {editingAsset && onEdit && (
        <AssetEditModal
          asset={editingAsset}
          open={!!editingAsset}
          onOpenChange={(open) => !open && setEditingAsset(null)}
          onEdit={(editPrompt) => onEdit(editingAsset.id, editPrompt)}
          editing={editing}
        />
      )}

      {/* Full preview modal */}
      {previewingAsset && (
        <AssetFullPreviewModal
          asset={previewingAsset}
          onClose={() => setPreviewingAsset(null)}
        />
      )}
    </div>
  );
}

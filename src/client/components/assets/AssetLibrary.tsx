import type { Asset } from '../../types';
import { cn } from '../../lib/utils';
import { AssetPreview } from './AssetPreview';

interface AssetLibraryProps {
  assets: Asset[];
  loading: boolean;
  error: string | null;
  onDelete?: (id: string) => void;
  onSelect?: (asset: Asset) => void;
  onRemix?: (asset: Asset) => void;
  onEdit?: (asset: Asset) => void;
  onRemoveBackground?: (asset: Asset) => void;
  onFullPreview?: (asset: Asset) => void;
  emptyMessage?: string;
  className?: string;
  columns?: 2 | 3 | 4;
}

export function AssetLibrary({
  assets,
  loading,
  error,
  onDelete,
  onSelect,
  onRemix,
  onEdit,
  onRemoveBackground,
  onFullPreview,
  emptyMessage = 'No assets generated yet',
  className,
  columns = 3,
}: AssetLibraryProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  }[columns];

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className={cn('grid gap-4', gridCols)}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-video animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('rounded-lg border border-destructive/50 bg-destructive/10 p-4', className)}>
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className={cn('rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center', className)}>
        <svg
          className="mx-auto h-12 w-12 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="mt-2 text-sm text-muted-foreground">{emptyMessage}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Generate AI images for your animations
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {assets.length} asset{assets.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className={cn('grid gap-4', gridCols)}>
        {assets.map((asset) => (
          <AssetPreview
            key={asset.id}
            asset={asset}
            onClick={onSelect ? () => onSelect(asset) : undefined}
            onDelete={onDelete ? () => onDelete(asset.id) : undefined}
            onRemix={onRemix ? () => onRemix(asset) : undefined}
            onEdit={onEdit ? () => onEdit(asset) : undefined}
            onRemoveBackground={onRemoveBackground ? () => onRemoveBackground(asset) : undefined}
            onFullPreview={onFullPreview ? () => onFullPreview(asset) : undefined}
            showDetails
          />
        ))}
      </div>
    </div>
  );
}

import type { Asset } from '../../types';
import { cn } from '../../lib/utils';

interface AssetPreviewProps {
  asset: Asset;
  onDelete?: () => void;
  onClick?: () => void;
  onRemix?: () => void;
  className?: string;
  showDetails?: boolean;
}

export function AssetPreview({
  asset,
  onDelete,
  onClick,
  onRemix,
  className,
  showDetails = false,
}: AssetPreviewProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/50 hover:shadow-md',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* Image preview */}
      <div className="relative aspect-video bg-muted">
        <img
          src={asset.filePath}
          alt={asset.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />

        {/* Source badge */}
        <div className="absolute bottom-2 left-2">
          <span className="rounded-full bg-background/80 px-2 py-0.5 text-xs font-medium text-foreground backdrop-blur-sm">
            {asset.source === 'nano-bananas' ? 'AI Generated' : 'Uploaded'}
          </span>
        </div>
      </div>

      {/* Details section (optional) */}
      {showDetails && (
        <div className="p-3">
          <h4 className="truncate text-sm font-medium text-foreground">
            {asset.name}
          </h4>
          {asset.promptUsed && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {asset.promptUsed}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date(asset.createdAt).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {onRemix && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemix();
            }}
            className="rounded-full bg-background/80 p-1.5 hover:bg-primary hover:text-primary-foreground backdrop-blur-sm"
            aria-label="Remix asset"
            title="Edit prompt & regenerate"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded-full bg-background/80 p-1.5 hover:bg-destructive hover:text-destructive-foreground backdrop-blur-sm"
            aria-label="Delete asset"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

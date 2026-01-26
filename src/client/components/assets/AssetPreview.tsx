import type { Asset } from '../../types';
import { cn } from '../../lib/utils';

interface AssetPreviewProps {
  asset: Asset;
  onDelete?: () => void;
  onClick?: () => void;
  onRemix?: () => void;
  onEdit?: () => void;
  onRemoveBackground?: () => void;
  onFullPreview?: () => void;
  className?: string;
  showDetails?: boolean;
}

export function AssetPreview({
  asset,
  onDelete,
  onClick,
  onRemix,
  onEdit,
  onRemoveBackground,
  onFullPreview,
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
        {onFullPreview && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFullPreview();
            }}
            className="rounded-full bg-background/80 p-1.5 hover:bg-primary hover:text-primary-foreground backdrop-blur-sm"
            aria-label="View full size"
            title="View full size"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </button>
        )}
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="rounded-full bg-background/80 p-1.5 hover:bg-primary hover:text-primary-foreground backdrop-blur-sm"
            aria-label="Edit image"
            title="Edit with AI"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        )}
        {onRemoveBackground && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveBackground();
            }}
            className="rounded-full bg-background/80 p-1.5 hover:bg-primary hover:text-primary-foreground backdrop-blur-sm"
            aria-label="Remove background"
            title="Remove background"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        )}
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

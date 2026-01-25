import type { BoardItem } from '../types';
import { cn, formatDuration, parseTags } from '../lib/utils';
import { IdeaPreviewCard } from './ideas/IdeaPreviewCard';

interface BoardItemCardProps {
  item: BoardItem;
  onClick?: () => void;
  onDelete?: () => void;
  onRemix?: () => void;
  onRetry?: () => void;
  onDismiss?: () => void;
  onPendingClick?: () => void;
  onPendingDelete?: () => void;
  className?: string;
}

export function BoardItemCard({
  item,
  onClick,
  onDelete,
  onRemix,
  onRetry,
  onDismiss,
  onPendingClick,
  onPendingDelete,
  className,
}: BoardItemCardProps) {
  if (item.type === 'pending') {
    return (
      <IdeaPreviewCard
        idea={item.data}
        onClick={onPendingClick || (() => {})}
        onDelete={onPendingDelete}
        className={className}
      />
    );
  }

  if (item.type === 'generating') {
    return <GeneratingCard item={item} className={className} />;
  }

  if (item.type === 'failed') {
    return <FailedCard item={item} onRetry={onRetry} onDismiss={onDismiss} className={className} />;
  }

  return (
    <ComponentCard
      item={item}
      onClick={onClick}
      onDelete={onDelete}
      onRemix={onRemix}
      className={className}
    />
  );
}

function GeneratingCard({
  item,
  className,
}: {
  item: Extract<BoardItem, { type: 'generating' }>;
  className?: string;
}) {
  const colors = item.idea.colors || [];
  const suggestedAssets = item.idea.suggestedAssets || [];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border-2 border-dashed border-primary/50 bg-card animate-pulse',
        className
      )}
    >
      {/* Color preview header with loading overlay */}
      <div className="relative flex h-24">
        {colors.length > 0 ? (
          colors.map((color, i) => (
            <div
              key={i}
              className="flex-1 opacity-60"
              style={{ backgroundColor: color }}
            />
          ))
        ) : (
          <div className="flex-1 bg-gradient-to-br from-primary/20 to-secondary/20" />
        )}
        {/* Loading overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-background/60">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
            <span className="text-xs font-medium text-primary">
              {item.status === 'queued' ? 'Queued...' : 'Generating...'}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground truncate">{item.idea.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
          {item.idea.description}
        </p>

        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <svg className="h-3 w-3 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
            </svg>
            Building with Claude Code
          </span>
          {suggestedAssets.length > 0 && (
            <span className="inline-flex items-center gap-1 text-muted-foreground/70">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {suggestedAssets.length} assets suggested
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function FailedCard({
  item,
  onRetry,
  onDismiss,
  className,
}: {
  item: Extract<BoardItem, { type: 'failed' }>;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}) {
  const colors = item.idea.colors || [];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border border-destructive/50 bg-card',
        className
      )}
    >
      {/* Color preview header with error overlay */}
      <div className="relative flex h-24">
        {colors.length > 0 ? (
          colors.map((color, i) => (
            <div
              key={i}
              className="flex-1 opacity-40 grayscale"
              style={{ backgroundColor: color }}
            />
          ))
        ) : (
          <div className="flex-1 bg-gradient-to-br from-destructive/20 to-destructive/10" />
        )}
        {/* Error overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-background/70">
          <div className="flex flex-col items-center gap-1">
            <svg className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="text-xs font-medium text-destructive">Failed</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground truncate">{item.idea.title}</h3>
        <p className="mt-1 text-sm text-destructive line-clamp-2">
          {item.error}
        </p>

        <div className="mt-3 flex items-center gap-2">
          {onRetry && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRetry();
              }}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/80 transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ComponentCard({
  item,
  onClick,
  onDelete,
  onRemix,
  className,
}: {
  item: Extract<BoardItem, { type: 'component' }>;
  onClick?: () => void;
  onDelete?: () => void;
  onRemix?: () => void;
  className?: string;
}) {
  const component = item.data;
  const colors = component.ideaJson?.colors || [];
  const tags = parseTags(component.tags);
  const suggestedAssets = component.ideaJson?.suggestedAssets || [];

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* Color preview header */}
      <div className="flex h-24">
        {colors.length > 0 ? (
          colors.map((color, i) => (
            <div
              key={i}
              className="flex-1"
              style={{ backgroundColor: color }}
            />
          ))
        ) : (
          <div className="flex-1 bg-gradient-to-br from-primary/20 to-secondary/20" />
        )}
      </div>

      {/* Asset suggestion badge */}
      {suggestedAssets.length > 0 && (
        <div className="absolute top-2 left-2 rounded-full bg-background/90 px-2 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm flex items-center gap-1">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {suggestedAssets.length} asset{suggestedAssets.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground truncate">{component.name}</h3>
        {component.description && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {component.description}
          </p>
        )}

        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatDuration(component.durationFrames, component.fps)}</span>
          <span>|</span>
          <span>{component.width}x{component.height}</span>
          <span>|</span>
          <span>{component.fps}fps</span>
        </div>

        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {onRemix && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemix();
            }}
            className="rounded-full bg-background/80 p-1.5 hover:bg-primary hover:text-primary-foreground backdrop-blur-sm"
            title="Remix this component"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
            title="Delete component"
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

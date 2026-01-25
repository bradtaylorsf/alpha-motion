import type { Component } from '../../types';
import { cn, formatDuration } from '../../lib/utils';

interface ComponentCardProps {
  component: Component;
  onClick?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function ComponentCard({ component, onClick, onDelete, className }: ComponentCardProps) {
  const colors = component.ideaJson?.colors || [];

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

        {component.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {component.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
              >
                {tag}
              </span>
            ))}
            {component.tags.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{component.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Delete button */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-2 right-2 rounded-full bg-background/80 p-1.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

import type { PendingIdea } from '../../types';
import { cn } from '../../lib/utils';

interface IdeaPreviewCardProps {
  idea: PendingIdea;
  onClick: () => void;
  onDelete?: () => void;
  className?: string;
}

export function IdeaPreviewCard({
  idea,
  onClick,
  onDelete,
  className,
}: IdeaPreviewCardProps) {
  const colors = idea.idea.colors || [];
  const suggestedAssets = idea.idea.suggestedAssets || [];
  const generatedAssets = idea.assets || [];

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg border-2 border-dashed border-amber-500/50 bg-card transition-all hover:border-amber-500 hover:shadow-lg cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* Color preview header */}
      <div className="relative flex h-24">
        {colors.length > 0 ? (
          colors.map((color, i) => (
            <div
              key={i}
              className="flex-1"
              style={{ backgroundColor: color }}
            />
          ))
        ) : (
          <div className="flex-1 bg-gradient-to-br from-amber-500/20 to-orange-500/20" />
        )}

        {/* Pending badge */}
        <div className="absolute inset-0 flex items-center justify-center bg-background/40">
          <div className="rounded-full bg-amber-500/90 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
            Ready to Generate
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground truncate">{idea.idea.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
          {idea.idea.description}
        </p>

        {/* Stats row */}
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {/* Colors indicator */}
            <span className="flex items-center gap-1">
              <div className="flex -space-x-1">
                {colors.slice(0, 3).map((color, i) => (
                  <div
                    key={i}
                    className="h-3 w-3 rounded-full border border-background"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              {colors.length > 0 && <span>{colors.length}</span>}
            </span>

            {/* Assets indicator */}
            {(suggestedAssets.length > 0 || generatedAssets.length > 0) && (
              <span className="flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {generatedAssets.length > 0 ? (
                  <span className="text-green-600">{generatedAssets.length} ready</span>
                ) : (
                  <span>{suggestedAssets.length} suggested</span>
                )}
              </span>
            )}
          </div>

          {/* Settings */}
          <span>
            {idea.settings.width}x{idea.settings.height}
          </span>
        </div>

        {/* Action hint */}
        <div className="mt-3 flex items-center justify-center">
          <span className="text-xs font-medium text-amber-600 group-hover:text-amber-500 transition-colors">
            Click to edit & generate
          </span>
        </div>
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

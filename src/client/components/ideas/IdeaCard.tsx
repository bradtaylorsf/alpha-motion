import type { AnimationIdea } from '../../types';
import { cn } from '../../lib/utils';

interface IdeaCardProps {
  idea: AnimationIdea;
  onGenerate?: () => void;
  isGenerating?: boolean;
  className?: string;
}

export function IdeaCard({ idea, onGenerate, isGenerating, className }: IdeaCardProps) {
  return (
    <div className={cn('rounded-lg border border-border bg-card p-6', className)}>
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-foreground">{idea.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{idea.description}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Style:</span>
          <span className="ml-2 text-foreground">{idea.style}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Motion:</span>
          <span className="ml-2 text-foreground">{idea.motion}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Duration:</span>
          <span className="ml-2 text-foreground">{idea.duration}</span>
        </div>
      </div>

      <div className="mt-4">
        <span className="text-sm text-muted-foreground">Colors:</span>
        <div className="mt-1 flex gap-2">
          {idea.colors.map((color, i) => (
            <div
              key={i}
              className="h-6 w-6 rounded border border-border"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      <div className="mt-4">
        <span className="text-sm text-muted-foreground">Elements:</span>
        <div className="mt-1 flex flex-wrap gap-1">
          {idea.elements.map((element, i) => (
            <span
              key={i}
              className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
            >
              {element}
            </span>
          ))}
        </div>
      </div>

      {onGenerate && (
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className={cn(
            'mt-6 w-full rounded-md px-4 py-2 text-sm font-medium transition-colors',
            isGenerating
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
        >
          {isGenerating ? 'Generating...' : 'Generate Component'}
        </button>
      )}
    </div>
  );
}

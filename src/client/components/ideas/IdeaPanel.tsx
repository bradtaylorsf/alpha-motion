import { useState, useEffect, useRef } from 'react';
import { useIdeas } from '../../hooks/useIdeas';
import { useGeneration } from '../../hooks/useGeneration';
import { IdeaCard } from './IdeaCard';
import { cn } from '../../lib/utils';
import type { Component } from '../../types';

interface IdeaPanelProps {
  onComponentGenerated?: (component: Component) => void;
}

export function IdeaPanel({ onComponentGenerated }: IdeaPanelProps) {
  const [mode, setMode] = useState<'random' | 'expand'>('random');
  const [userInput, setUserInput] = useState('');
  const handledComponentRef = useRef<string | null>(null);

  const { idea, loading: ideaLoading, error: ideaError, generateRandom, expand, clearIdea } = useIdeas();
  const { isGenerating, component, error: genError, generate, reset } = useGeneration();

  const handleGenerateRandom = async () => {
    await generateRandom();
  };

  const handleExpand = async () => {
    if (userInput.trim()) {
      await expand(userInput.trim());
    }
  };

  const handleGenerate = async () => {
    if (idea) {
      await generate(idea);
    }
  };

  // When component is generated, notify parent and reset
  useEffect(() => {
    if (component && component.id !== handledComponentRef.current) {
      handledComponentRef.current = component.id;
      onComponentGenerated?.(component);
      reset();
      clearIdea();
    }
  }, [component, onComponentGenerated, reset, clearIdea]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold text-foreground">Idea Generator</h2>
        <div className="flex rounded-lg border border-border">
          <button
            onClick={() => setMode('random')}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              mode === 'random'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Random
          </button>
          <button
            onClick={() => setMode('expand')}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              mode === 'expand'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Expand Idea
          </button>
        </div>
      </div>

      {mode === 'random' ? (
        <div>
          <button
            onClick={handleGenerateRandom}
            disabled={ideaLoading}
            className={cn(
              'rounded-md px-6 py-3 text-sm font-medium transition-colors',
              ideaLoading
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-accent text-accent-foreground hover:bg-accent/90'
            )}
          >
            {ideaLoading ? 'Generating...' : 'Generate Random Idea'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Describe your animation idea... (e.g., 'A logo that bounces in with particles')"
            className="h-24 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={handleExpand}
            disabled={ideaLoading || !userInput.trim()}
            className={cn(
              'self-start rounded-md px-6 py-3 text-sm font-medium transition-colors',
              ideaLoading || !userInput.trim()
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-accent text-accent-foreground hover:bg-accent/90'
            )}
          >
            {ideaLoading ? 'Expanding...' : 'Expand Idea'}
          </button>
        </div>
      )}

      {ideaError && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {ideaError}
        </div>
      )}

      {genError && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {genError}
        </div>
      )}

      {isGenerating && (
        <div className="flex items-center gap-3 rounded-md bg-primary/10 p-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-foreground">Generating component with Claude Code...</span>
        </div>
      )}

      {idea && !isGenerating && (
        <IdeaCard idea={idea} onGenerate={handleGenerate} isGenerating={isGenerating} />
      )}
    </div>
  );
}

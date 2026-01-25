import { useState } from 'react';
import { cn } from '../lib/utils';

interface IdeaInputProps {
  onGenerateRandom: (count: number) => void;
  onExpandIdea: (idea: string) => void;
  isGenerating: boolean;
}

export function IdeaInput({ onGenerateRandom, onExpandIdea, isGenerating }: IdeaInputProps) {
  const [userInput, setUserInput] = useState('');
  const [count, setCount] = useState(1);

  const handleGenerateRandom = () => {
    onGenerateRandom(count);
  };

  const handleExpandIdea = () => {
    if (userInput.trim()) {
      onExpandIdea(userInput.trim());
      setUserInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && userInput.trim()) {
      e.preventDefault();
      handleExpandIdea();
    }
  };

  return (
    <div className="border-b border-border bg-card/50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Input area */}
        <div className="mb-4">
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your animation idea... (e.g., 'A bouncing logo with particle effects' or 'Chart that animates data points sequentially')"
            className="w-full h-24 resize-none rounded-lg border border-input bg-background px-4 py-3 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            disabled={isGenerating}
          />
        </div>

        {/* Actions row */}
        <div className="flex items-center justify-between">
          {/* Generate from input */}
          <button
            onClick={handleExpandIdea}
            disabled={isGenerating || !userInput.trim()}
            className={cn(
              'rounded-lg px-5 py-2.5 text-sm font-medium transition-all',
              isGenerating || !userInput.trim()
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow'
            )}
          >
            Generate from Idea
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="h-px w-8 bg-border" />
            <span className="text-sm">or</span>
            <div className="h-px w-8 bg-border" />
          </div>

          {/* Random generation controls */}
          <div className="flex items-center gap-3">
            {/* Count selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Generate</label>
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                disabled={isGenerating}
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="text-sm text-muted-foreground">random</span>
            </div>

            {/* Generate Random button */}
            <button
              onClick={handleGenerateRandom}
              disabled={isGenerating}
              className={cn(
                'flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all',
                isGenerating
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm hover:shadow'
              )}
            >
              {/* Dice icon */}
              <svg
                className={cn('h-4 w-4', isGenerating && 'animate-spin')}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isGenerating ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                ) : (
                  <>
                    <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth={2} />
                    <circle cx="8.5" cy="8.5" r="1" fill="currentColor" />
                    <circle cx="15.5" cy="8.5" r="1" fill="currentColor" />
                    <circle cx="8.5" cy="15.5" r="1" fill="currentColor" />
                    <circle cx="15.5" cy="15.5" r="1" fill="currentColor" />
                    <circle cx="12" cy="12" r="1" fill="currentColor" />
                  </>
                )}
              </svg>
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useCallback } from 'react';
import { IdeaPanel } from './components/ideas/IdeaPanel';
import { MoodBoard } from './components/board/MoodBoard';
import type { Component } from './types';
import { cn } from './lib/utils';

type View = 'ideas' | 'board';

export function App() {
  const [view, setView] = useState<View>('ideas');
  const [newComponent, setNewComponent] = useState<Component | null>(null);

  const handleComponentGenerated = useCallback((component: Component) => {
    setNewComponent(component);
    setView('board');
    // Clear after a tick to allow MoodBoard to pick it up
    setTimeout(() => setNewComponent(null), 100);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <svg
              className="h-6 w-6 text-primary-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Remotion Moodboard</h1>
            <p className="text-sm text-muted-foreground">AI-powered animation ideas</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex rounded-lg border border-border">
          <button
            onClick={() => setView('ideas')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors',
              view === 'ideas'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            Ideas
          </button>
          <button
            onClick={() => setView('board')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors',
              view === 'board'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
            Board
          </button>
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {view === 'ideas' ? (
          <IdeaPanel onComponentGenerated={handleComponentGenerated} />
        ) : (
          <MoodBoard newComponent={newComponent} />
        )}
      </main>
    </div>
  );
}

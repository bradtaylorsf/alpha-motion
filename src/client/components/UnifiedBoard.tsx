import { useState } from 'react';
import { useBoardItems } from '../hooks/useBoardItems';
import { IdeaInput } from './IdeaInput';
import { BoardItemCard } from './BoardItemCard';
import { PreviewModal } from './preview/PreviewModal';
import { parseTags } from '../lib/utils';
import type { Component } from '../types';

export function UnifiedBoard() {
  const {
    boardItems,
    loading,
    error,
    isGeneratingIdeas,
    generateRandomIdeas,
    expandAndGenerate,
    deleteComponent,
    retryFailed,
    dismissFailed,
  } = useBoardItems();

  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = boardItems.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();

    if (item.type === 'component') {
      const tags = parseTags(item.data.tags);
      return (
        item.data.name.toLowerCase().includes(query) ||
        item.data.description?.toLowerCase().includes(query) ||
        tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    // For generating/failed items, search by idea title/description
    return (
      item.idea.title.toLowerCase().includes(query) ||
      item.idea.description.toLowerCase().includes(query)
    );
  });

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this component?')) {
      await deleteComponent(id);
    }
  };

  const componentCount = boardItems.filter((i) => i.type === 'component').length;
  const generatingCount = boardItems.filter((i) => i.type === 'generating').length;

  return (
    <div className="flex flex-col h-full">
      {/* Idea Input Section */}
      <IdeaInput
        onGenerateRandom={generateRandomIdeas}
        onExpandIdea={expandAndGenerate}
        isGenerating={isGeneratingIdeas}
      />

      {/* Board Section */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Board Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground">Your Components</h2>
            {generatingCount > 0 && (
              <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                {generatingCount} generating
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search components..."
              className="w-64 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span className="text-sm text-muted-foreground">
              {componentCount} component{componentCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mx-4 mt-4 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Grid */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <svg className="h-16 w-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              <p className="text-lg font-medium">No components yet</p>
              <p className="text-sm mt-1">
                Describe an idea above or click "Generate" to create random animations
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map((item) => (
                <BoardItemCard
                  key={item.type === 'component' ? item.data.id : item.id}
                  item={item}
                  onClick={
                    item.type === 'component'
                      ? () => setSelectedComponent(item.data)
                      : undefined
                  }
                  onDelete={
                    item.type === 'component'
                      ? () => handleDelete(item.data.id)
                      : undefined
                  }
                  onRetry={
                    item.type === 'failed'
                      ? () => retryFailed(item.id)
                      : undefined
                  }
                  onDismiss={
                    item.type === 'failed'
                      ? () => dismissFailed(item.id)
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {selectedComponent && (
        <PreviewModal
          component={selectedComponent}
          onClose={() => setSelectedComponent(null)}
        />
      )}
    </div>
  );
}

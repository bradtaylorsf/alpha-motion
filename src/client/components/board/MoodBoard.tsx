import { useState, useEffect, useRef } from 'react';
import { useComponents } from '../../hooks/useComponents';
import { ComponentCard } from './ComponentCard';
import { PreviewModal } from '../preview/PreviewModal';
import type { Component } from '../../types';

interface MoodBoardProps {
  newComponent?: Component | null;
}

export function MoodBoard({ newComponent }: MoodBoardProps) {
  const { components, loading, deleteComponent, addComponent } = useComponents();
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const addedComponentsRef = useRef<Set<string>>(new Set());

  // Add new component when it comes in
  useEffect(() => {
    if (newComponent && !addedComponentsRef.current.has(newComponent.id)) {
      addedComponentsRef.current.add(newComponent.id);
      addComponent(newComponent);
    }
  }, [newComponent, addComponent]);

  const filteredComponents = components.filter((c) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      c.description?.toLowerCase().includes(query) ||
      c.tags.some((t) => t.toLowerCase().includes(query))
    );
  });

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this component?')) {
      await deleteComponent(id);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="text-xl font-semibold text-foreground">Mood Board</h2>
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search components..."
            className="w-64 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <span className="text-sm text-muted-foreground">
            {filteredComponents.length} component{filteredComponents.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filteredComponents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <svg className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-lg font-medium">No components yet</p>
            <p className="text-sm">Generate an idea to create your first animation</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredComponents.map((component) => (
              <ComponentCard
                key={component.id}
                component={component}
                onClick={() => setSelectedComponent(component)}
                onDelete={() => handleDelete(component.id)}
              />
            ))}
          </div>
        )}
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

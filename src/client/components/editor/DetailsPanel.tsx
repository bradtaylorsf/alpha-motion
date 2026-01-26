import { useState } from 'react';
import { cn } from '../../lib/utils';
import { SettingsTab } from './SettingsTab';
import { ExportTab } from './ExportTab';
import { EditTab } from './EditTab';
import type { Component, Asset } from '../../types';

interface DetailsPanelProps {
  component: Component;
  assets: Asset[];
  onSettingsChange: (settings: Partial<Pick<Component, 'durationFrames' | 'fps' | 'width' | 'height'>>) => void;
  onEdit: (instructions: string) => void;
  onRemix: (instructions: string) => void;
  isEditing: boolean;
  isRemixing: boolean;
  editError: string | null;
}

type TabType = 'edit' | 'settings' | 'export';

export function DetailsPanel({
  component,
  assets,
  onSettingsChange,
  onEdit,
  onRemix,
  isEditing,
  isRemixing,
  editError,
}: DetailsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('edit');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const tabs: { id: TabType; label: string }[] = [
    { id: 'edit', label: 'Edit' },
    { id: 'settings', label: 'Settings' },
    { id: 'export', label: 'Export' },
  ];

  return (
    <div className={cn('border-t border-border bg-card flex flex-col', isCollapsed ? 'h-10' : 'h-64')}>
      {/* Tab header */}
      <div className="flex items-center justify-between border-b border-border px-2 shrink-0">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (isCollapsed) setIsCollapsed(false);
              }}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors relative',
                activeTab === tab.id && !isCollapsed
                  ? 'text-foreground border-b-2 border-primary -mb-px'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 text-muted-foreground hover:text-foreground rounded transition-colors"
        >
          <svg
            className={cn('h-4 w-4 transition-transform', isCollapsed ? 'rotate-180' : '')}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Tab content */}
      {!isCollapsed && (
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'edit' && (
            <EditTab
              componentId={component.id}
              assets={assets}
              isEditing={isEditing}
              isRemixing={isRemixing}
              error={editError}
              onEdit={onEdit}
              onRemix={onRemix}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsTab
              durationFrames={component.durationFrames}
              fps={component.fps}
              width={component.width}
              height={component.height}
              onChange={onSettingsChange}
            />
          )}
          {activeTab === 'export' && (
            <ExportTab
              componentId={component.id}
              componentName={component.name}
            />
          )}
        </div>
      )}
    </div>
  );
}

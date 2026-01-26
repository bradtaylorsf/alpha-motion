import { useState, useEffect } from 'react';
import type { PendingIdea, AnimationIdea, GenerationSettings, Asset } from '../../types';
import { useAssets } from '../../hooks/useAssets';
import { AssetGenerator, type GenerateOptions } from '../assets/AssetGenerator';
import { AssetLibrary } from '../assets/AssetLibrary';
import { AssetEditModal } from '../assets/AssetEditModal';
import { AssetFullPreviewModal } from '../assets/AssetFullPreviewModal';

interface IdeaEditModalProps {
  pendingIdea: PendingIdea;
  onClose: () => void;
  onUpdate: (idea: AnimationIdea, settings: GenerationSettings) => void;
  onGenerate: (idea: AnimationIdea, settings: GenerationSettings, assets: Asset[]) => void;
  onAssetGenerated: (asset: Asset) => void;
  onAssetDeleted: (assetId: string) => void;
}

export function IdeaEditModal({
  pendingIdea,
  onClose,
  onUpdate,
  onGenerate,
  onAssetGenerated,
  onAssetDeleted,
}: IdeaEditModalProps) {
  // Local state for editing
  const [idea, setIdea] = useState<AnimationIdea>(pendingIdea.idea);
  const [settings, setSettings] = useState<GenerationSettings>(pendingIdea.settings);
  const [newColor, setNewColor] = useState('#3b82f6');
  const [newAssetPrompt, setNewAssetPrompt] = useState('');
  const [remixPrompt, setRemixPrompt] = useState<string | null>(null);

  // Assets hook - we'll manage assets locally but sync with parent
  const {
    generating: assetsGenerating,
    editing: assetsEditing,
    removingBackground,
    generateAsset,
    generateFromSuggestions,
    deleteAsset,
    editAsset,
    removeBackground,
  } = useAssets();

  // Edit modal state
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  // Full preview modal state
  const [previewingAsset, setPreviewingAsset] = useState<Asset | null>(null);

  // Local assets state (synced from pendingIdea)
  const [localAssets, setLocalAssets] = useState<Asset[]>(pendingIdea.assets);

  // Sync assets when pendingIdea changes
  useEffect(() => {
    setLocalAssets(pendingIdea.assets);
  }, [pendingIdea.assets]);

  // Close on escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleGenerateAsset = async (prompt: string, options?: GenerateOptions) => {
    const asset = await generateAsset(prompt, {
      aspectRatio: options?.aspectRatio,
      transparent: options?.transparent,
    });
    if (asset) {
      setLocalAssets((prev) => [asset, ...prev]);
      onAssetGenerated(asset);
    }
    return asset;
  };

  const handleGenerateBatch = async (prompts: string[], options?: GenerateOptions) => {
    const result = await generateFromSuggestions(prompts, {
      aspectRatio: options?.aspectRatio,
    });
    if (result.assets.length > 0) {
      setLocalAssets((prev) => [...result.assets, ...prev]);
      result.assets.forEach(onAssetGenerated);
    }
    return result;
  };

  const handleRemixAsset = (asset: Asset) => {
    // Extract the original prompt (before enhancement) if possible
    // The promptUsed might contain the enhanced version, so we use the asset name as fallback
    const originalPrompt = asset.promptUsed?.split('. Style:')[0] || asset.name;
    setRemixPrompt(originalPrompt);
    // Scroll to generator (it's at the top of assets section)
    document.getElementById('asset-generator')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteAsset = async (assetId: string) => {
    const success = await deleteAsset(assetId);
    if (success) {
      setLocalAssets((prev) => prev.filter((a) => a.id !== assetId));
      onAssetDeleted(assetId);
    }
  };

  const handleEditAsset = async (assetId: string, editPrompt: string) => {
    const editedAsset = await editAsset(assetId, { editPrompt });
    if (editedAsset) {
      setLocalAssets((prev) => [editedAsset, ...prev]);
      onAssetGenerated(editedAsset);
    }
    return editedAsset;
  };

  const handleRemoveBackground = async (asset: Asset) => {
    const metadata = asset.metadata as Record<string, unknown> | null;
    if (metadata?.transparent) {
      return; // Already transparent
    }
    const transparentAsset = await removeBackground(asset.id);
    if (transparentAsset) {
      setLocalAssets((prev) => [transparentAsset, ...prev]);
      onAssetGenerated(transparentAsset);
    }
  };

  const handleColorChange = (index: number, color: string) => {
    const newColors = [...idea.colors];
    newColors[index] = color;
    setIdea({ ...idea, colors: newColors });
  };

  const handleAddColor = () => {
    setIdea({ ...idea, colors: [...idea.colors, newColor] });
  };

  const handleRemoveColor = (index: number) => {
    setIdea({ ...idea, colors: idea.colors.filter((_, i) => i !== index) });
  };

  const handleAddSuggestedAsset = () => {
    if (newAssetPrompt.trim()) {
      setIdea({
        ...idea,
        suggestedAssets: [...idea.suggestedAssets, newAssetPrompt.trim()],
      });
      setNewAssetPrompt('');
    }
  };

  const handleRemoveSuggestedAsset = (index: number) => {
    setIdea({
      ...idea,
      suggestedAssets: idea.suggestedAssets.filter((_, i) => i !== index),
    });
  };

  const handleElementsChange = (value: string) => {
    setIdea({ ...idea, elements: value.split(',').map((s) => s.trim()).filter(Boolean) });
  };

  const handleGenerate = () => {
    onGenerate(idea, settings, localAssets);
  };

  const durationSeconds = settings.durationFrames / settings.fps;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-lg border border-border bg-card shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Edit Idea</h2>
            <p className="text-sm text-muted-foreground">
              Customize your animation before generating
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Title & Description */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Title</label>
              <input
                type="text"
                value={idea.title}
                onChange={(e) => setIdea({ ...idea, title: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Description</label>
              <textarea
                value={idea.description}
                onChange={(e) => setIdea({ ...idea, description: e.target.value })}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>
          </div>

          {/* Style & Motion */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Style</label>
              <input
                type="text"
                value={idea.style}
                onChange={(e) => setIdea({ ...idea, style: e.target.value })}
                placeholder="e.g., minimalist, bold, playful"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Motion</label>
              <input
                type="text"
                value={idea.motion}
                onChange={(e) => setIdea({ ...idea, motion: e.target.value })}
                placeholder="e.g., smooth, bouncy, dramatic"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Elements */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Elements (comma-separated)
            </label>
            <input
              type="text"
              value={idea.elements.join(', ')}
              onChange={(e) => handleElementsChange(e.target.value)}
              placeholder="e.g., logo, particles, text"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Colors */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Colors</label>
            <div className="flex flex-wrap items-center gap-2">
              {idea.colors.map((color, i) => (
                <div key={i} className="relative group">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => handleColorChange(i, e.target.value)}
                    className="h-10 w-10 rounded-md border border-input cursor-pointer"
                  />
                  <button
                    onClick={() => handleRemoveColor(i)}
                    className="absolute -top-1 -right-1 rounded-full bg-destructive p-0.5 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-1">
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="h-10 w-10 rounded-md border border-dashed border-input cursor-pointer opacity-50"
                />
                <button
                  onClick={handleAddColor}
                  className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground hover:bg-secondary/80"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Dimensions & Duration */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Width</label>
              <input
                type="number"
                value={settings.width}
                onChange={(e) => setSettings({ ...settings, width: parseInt(e.target.value) || 1920 })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Height</label>
              <input
                type="number"
                value={settings.height}
                onChange={(e) => setSettings({ ...settings, height: parseInt(e.target.value) || 1080 })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">FPS</label>
              <select
                value={settings.fps}
                onChange={(e) => setSettings({ ...settings, fps: parseInt(e.target.value) })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value={24}>24</option>
                <option value={30}>30</option>
                <option value={60}>60</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Duration ({durationSeconds.toFixed(1)}s)
              </label>
              <input
                type="number"
                value={settings.durationFrames}
                onChange={(e) => setSettings({ ...settings, durationFrames: parseInt(e.target.value) || 150 })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Assets Section */}
          <div className="border-t border-border pt-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Assets</h3>

            {/* Add new suggested asset */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-1">
                Suggested Asset Prompts
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newAssetPrompt}
                  onChange={(e) => setNewAssetPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSuggestedAsset()}
                  placeholder="Add a new asset prompt..."
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  onClick={handleAddSuggestedAsset}
                  disabled={!newAssetPrompt.trim()}
                  className="rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50"
                >
                  Add
                </button>
              </div>

              {/* List of suggested assets with remove buttons */}
              {idea.suggestedAssets.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {idea.suggestedAssets.map((asset, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-sm"
                    >
                      <span className="truncate max-w-[200px]">{asset}</span>
                      <button
                        onClick={() => handleRemoveSuggestedAsset(i)}
                        className="ml-1 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Asset Generator */}
            <div id="asset-generator">
              <AssetGenerator
                suggestedAssets={idea.suggestedAssets}
                generating={assetsGenerating}
                onGenerate={handleGenerateAsset}
                onGenerateBatch={handleGenerateBatch}
                initialPrompt={remixPrompt}
                onInitialPromptUsed={() => setRemixPrompt(null)}
              />
            </div>

            {/* Generated Assets */}
            {localAssets.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-foreground mb-2">
                  Generated Assets ({localAssets.length})
                </h4>
                <AssetLibrary
                  assets={localAssets}
                  loading={false}
                  error={null}
                  onDelete={handleDeleteAsset}
                  onRemix={handleRemixAsset}
                  onEdit={(asset) => setEditingAsset(asset)}
                  onRemoveBackground={handleRemoveBackground}
                  onFullPreview={(asset) => setPreviewingAsset(asset)}
                  emptyMessage=""
                  columns={4}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4 shrink-0 bg-muted/30">
          <div className="text-sm text-muted-foreground">
            {localAssets.length > 0 && (
              <span className="text-green-600 font-medium">
                {localAssets.length} asset{localAssets.length !== 1 ? 's' : ''} ready
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Generate Video
            </button>
          </div>
        </div>
      </div>

      {/* Asset Edit Modal */}
      {editingAsset && (
        <AssetEditModal
          asset={editingAsset}
          open={!!editingAsset}
          onOpenChange={(open) => !open && setEditingAsset(null)}
          onEdit={(editPrompt) => handleEditAsset(editingAsset.id, editPrompt)}
          editing={assetsEditing}
        />
      )}

      {/* Asset Full Preview Modal */}
      {previewingAsset && (
        <AssetFullPreviewModal
          asset={previewingAsset}
          onClose={() => setPreviewingAsset(null)}
        />
      )}
    </div>
  );
}

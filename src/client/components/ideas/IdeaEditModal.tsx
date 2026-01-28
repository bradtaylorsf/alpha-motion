import { useState, useEffect, useRef, useCallback } from 'react';
import type { PendingIdea, AnimationIdea, GenerationSettings, Asset } from '../../types';
import { useAssets } from '../../hooks/useAssets';
import { AssetLibrary } from '../assets/AssetLibrary';
import { AssetEditModal } from '../assets/AssetEditModal';
import { AssetFullPreviewModal } from '../assets/AssetFullPreviewModal';
import { cn } from '../../lib/utils';

type AssetType = 'background' | 'icon' | 'texture' | 'character' | 'object';

const ASSET_TYPES: { value: AssetType; label: string; aspect: '16:9' | '1:1' | '3:4' }[] = [
  { value: 'background', label: 'Background', aspect: '16:9' },
  { value: 'icon', label: 'Icon', aspect: '1:1' },
  { value: 'texture', label: 'Texture', aspect: '1:1' },
  { value: 'character', label: 'Character', aspect: '3:4' },
  { value: 'object', label: 'Object', aspect: '1:1' },
];

function getAspectForType(type: AssetType): '16:9' | '1:1' | '3:4' {
  return ASSET_TYPES.find((t) => t.value === type)?.aspect || '1:1';
}

function inferAssetType(prompt: string): AssetType {
  const lower = prompt.toLowerCase();
  if (lower.includes('background') || lower.includes('backdrop') || lower.includes('scene') || lower.includes('landscape')) return 'background';
  if (lower.includes('icon') || lower.includes('logo') || lower.includes('symbol') || lower.includes('badge')) return 'icon';
  if (lower.includes('texture') || lower.includes('pattern') || lower.includes('overlay')) return 'texture';
  if (lower.includes('character') || lower.includes('person') || lower.includes('avatar') || lower.includes('portrait')) return 'character';
  return 'object';
}

function enhancePromptForType(prompt: string, type: AssetType): string {
  const styleHints: Record<AssetType, string> = {
    background: 'wide panoramic scene, full background image, atmospheric, suitable as video background',
    icon: 'simple icon design, centered, isolated on plain background, clean minimal style',
    texture: 'seamless tileable pattern, repeating texture, no distinct focal point',
    character: 'character portrait, centered subject, clean background, suitable for cutout',
    object: 'single object, centered, clean simple background, product-style photography',
  };
  return `${prompt}. Style: ${styleHints[type]}`;
}

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
  onUpdate: _onUpdate,
  onGenerate,
  onAssetGenerated,
  onAssetDeleted,
}: IdeaEditModalProps) {
  // Local state for editing
  const [idea, setIdea] = useState<AnimationIdea>(pendingIdea.idea);
  const [settings, setSettings] = useState<GenerationSettings>(pendingIdea.settings);
  const [newColor, setNewColor] = useState('#3b82f6');

  // Asset generation state
  const [assetPrompt, setAssetPrompt] = useState('');
  const [selectedAssetType, setSelectedAssetType] = useState<AssetType>('object');
  const [transparentBackground, setTransparentBackground] = useState(false);

  // Assets hook - we'll manage assets locally but sync with parent
  const {
    generating: assetsGenerating,
    uploading: assetsUploading,
    editing: assetsEditing,
    removingBackground,
    generateAsset,
    uploadAsset,
    deleteAsset,
    editAsset,
    removeBackground,
  } = useAssets();

  const isProcessing = assetsGenerating || assetsUploading || assetsEditing || removingBackground;

  // Edit modal state
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  // Full preview modal state
  const [previewingAsset, setPreviewingAsset] = useState<Asset | null>(null);

  // Upload state
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Upload each file
    Array.from(files).forEach(async (file) => {
      if (file.type.startsWith('image/')) {
        const asset = await uploadAsset(file);
        if (asset) {
          setLocalAssets((prev) => [asset, ...prev]);
          onAssetGenerated(asset);
        }
      }
    });
  }, [uploadAsset, onAssetGenerated]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleGenerateAsset = async () => {
    if (!assetPrompt.trim() || assetsGenerating) return;
    const enhancedPrompt = enhancePromptForType(assetPrompt.trim(), selectedAssetType);
    const asset = await generateAsset(enhancedPrompt, {
      aspectRatio: getAspectForType(selectedAssetType),
      transparent: transparentBackground,
    });
    if (asset) {
      setLocalAssets((prev) => [asset, ...prev]);
      onAssetGenerated(asset);
      setAssetPrompt('');
    }
  };

  const handleGenerateSuggestion = async (suggestion: string) => {
    if (assetsGenerating) return;
    const type = inferAssetType(suggestion);
    const enhancedPrompt = enhancePromptForType(suggestion, type);
    const asset = await generateAsset(enhancedPrompt, {
      aspectRatio: getAspectForType(type),
    });
    if (asset) {
      setLocalAssets((prev) => [asset, ...prev]);
      onAssetGenerated(asset);
    }
  };

  const handleRemixAsset = (asset: Asset) => {
    const originalPrompt = asset.promptUsed?.split('. Style:')[0] || asset.name;
    setAssetPrompt(originalPrompt);
    setSelectedAssetType(inferAssetType(originalPrompt));
    document.getElementById('asset-section')?.scrollIntoView({ behavior: 'smooth' });
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
          <div id="asset-section" className="border-t border-border pt-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Assets</h3>

            {/* Generate Asset */}
            <div className="space-y-3 mb-4">
              {/* Type selector */}
              <div className="flex flex-wrap gap-1">
                {ASSET_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setSelectedAssetType(type.value)}
                    disabled={isProcessing}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                      selectedAssetType === type.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    )}
                  >
                    {type.label}
                    <span className="ml-1 opacity-60">({type.aspect})</span>
                  </button>
                ))}
              </div>

              {/* Prompt input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={assetPrompt}
                  onChange={(e) => setAssetPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateAsset()}
                  placeholder={`Describe your ${selectedAssetType}...`}
                  disabled={isProcessing}
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                />
                <button
                  onClick={handleGenerateAsset}
                  disabled={isProcessing || !assetPrompt.trim()}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {assetsGenerating ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  ) : (
                    'Generate'
                  )}
                </button>
              </div>

              {/* Transparent toggle */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={transparentBackground}
                  onClick={() => setTransparentBackground(!transparentBackground)}
                  disabled={isProcessing}
                  className={cn(
                    'relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed',
                    transparentBackground ? 'bg-primary' : 'bg-muted'
                  )}
                >
                  <span
                    className={cn(
                      'pointer-events-none inline-block h-3 w-3 transform rounded-full bg-background shadow ring-0 transition-transform',
                      transparentBackground ? 'translate-x-3' : 'translate-x-0'
                    )}
                  />
                </button>
                <span className="text-xs text-muted-foreground">
                  Transparent background (slower)
                </span>
              </div>

              {/* Suggested prompts */}
              {idea.suggestedAssets.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Suggestions from idea:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {idea.suggestedAssets.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => handleGenerateSuggestion(suggestion)}
                        disabled={isProcessing}
                        className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              className={cn(
                'relative rounded-md border-2 border-dashed p-4 text-center transition-colors cursor-pointer mb-4',
                isDragging
                  ? 'border-primary bg-primary/10'
                  : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-secondary/50',
                isProcessing && 'opacity-50 cursor-not-allowed'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
                disabled={isProcessing}
              />
              {assetsUploading ? (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Uploading...
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isDragging ? 'Drop images here' : 'Click or drag to upload images'}
                </p>
              )}
            </div>

            {/* Assets Library */}
            {localAssets.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-foreground mb-2">
                  Your Assets ({localAssets.length})
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

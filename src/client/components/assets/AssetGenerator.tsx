import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';

export type AssetType = 'background' | 'icon' | 'texture' | 'character' | 'object';

export interface GenerateOptions {
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4';
  type?: AssetType;
  transparent?: boolean;
}

interface AssetGeneratorProps {
  suggestedAssets?: string[];
  generating: boolean;
  onGenerate: (prompt: string, options?: GenerateOptions) => Promise<unknown>;
  onGenerateBatch?: (prompts: string[], options?: GenerateOptions) => Promise<unknown>;
  componentId?: string;
  className?: string;
  initialPrompt?: string | null;
  onInitialPromptUsed?: () => void;
}

const ASSET_TYPES: { value: AssetType; label: string; aspect: '16:9' | '1:1' | '3:4'; description: string }[] = [
  { value: 'background', label: 'Background', aspect: '16:9', description: 'Full-screen backgrounds (16:9)' },
  { value: 'icon', label: 'Icon', aspect: '1:1', description: 'Square icons & logos (1:1)' },
  { value: 'texture', label: 'Texture', aspect: '1:1', description: 'Tileable patterns (1:1)' },
  { value: 'character', label: 'Character', aspect: '3:4', description: 'People & avatars (3:4)' },
  { value: 'object', label: 'Object', aspect: '1:1', description: 'Props & items (1:1)' },
];

function inferAssetType(prompt: string): AssetType {
  const lower = prompt.toLowerCase();
  if (lower.includes('background') || lower.includes('backdrop') || lower.includes('scene') || lower.includes('landscape')) return 'background';
  if (lower.includes('icon') || lower.includes('logo') || lower.includes('symbol') || lower.includes('badge')) return 'icon';
  if (lower.includes('texture') || lower.includes('pattern') || lower.includes('overlay')) return 'texture';
  if (lower.includes('character') || lower.includes('person') || lower.includes('avatar') || lower.includes('portrait')) return 'character';
  return 'object';
}

function getAspectForType(type: AssetType): '16:9' | '1:1' | '3:4' {
  const found = ASSET_TYPES.find((t) => t.value === type);
  return found?.aspect || '1:1';
}

// Enhance prompt based on asset type for better AI generation results
function enhancePromptForType(prompt: string, type: AssetType): string {
  const styleHints: Record<AssetType, string> = {
    background: 'wide panoramic scene, full background image, no main subject in center, atmospheric, suitable as video background',
    icon: 'simple icon design, centered, isolated on plain background, clean minimal style, suitable for UI',
    texture: 'seamless tileable pattern, repeating texture, no distinct focal point, suitable for overlay',
    character: 'character portrait, centered subject, clean background, suitable for cutout or compositing',
    object: 'single object, centered, clean simple background, product-style photography, suitable for compositing',
  };

  return `${prompt}. Style: ${styleHints[type]}`;
}

export function AssetGenerator({
  suggestedAssets = [],
  generating,
  onGenerate,
  onGenerateBatch,
  className,
  initialPrompt,
  onInitialPromptUsed,
}: AssetGeneratorProps) {
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedType, setSelectedType] = useState<AssetType>('object');
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [transparentBackground, setTransparentBackground] = useState(false);

  // Set initial prompt when provided (for remix functionality)
  useEffect(() => {
    if (initialPrompt) {
      setCustomPrompt(initialPrompt);
      // Infer type from the prompt
      const type = inferAssetType(initialPrompt);
      setSelectedType(type);
      onInitialPromptUsed?.();
    }
  }, [initialPrompt, onInitialPromptUsed]);

  const handleCustomGenerate = async () => {
    if (!customPrompt.trim() || generating) return;
    const enhancedPrompt = enhancePromptForType(customPrompt.trim(), selectedType);
    const options: GenerateOptions = {
      type: selectedType,
      aspectRatio: getAspectForType(selectedType),
      transparent: transparentBackground,
    };
    await onGenerate(enhancedPrompt, options);
    setCustomPrompt('');
  };

  const toggleSuggestion = (suggestion: string) => {
    setSelectedSuggestions((prev) => {
      const next = new Set(prev);
      if (next.has(suggestion)) {
        next.delete(suggestion);
      } else {
        next.add(suggestion);
      }
      return next;
    });
  };

  const handleGenerateSelected = async () => {
    if (selectedSuggestions.size === 0 || generating) return;
    // Generate each with its own inferred aspect ratio and enhanced prompt
    const prompts = Array.from(selectedSuggestions);
    for (const prompt of prompts) {
      const type = inferAssetType(prompt);
      const enhancedPrompt = enhancePromptForType(prompt, type);
      const options: GenerateOptions = {
        type,
        aspectRatio: getAspectForType(type),
      };
      await onGenerate(enhancedPrompt, options);
    }
    setSelectedSuggestions(new Set());
  };

  const handleGenerateSingle = async (prompt: string) => {
    if (generating) return;
    const type = inferAssetType(prompt);
    const enhancedPrompt = enhancePromptForType(prompt, type);
    const options: GenerateOptions = {
      type,
      aspectRatio: getAspectForType(type),
    };
    await onGenerate(enhancedPrompt, options);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Custom prompt input */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">
            {initialPrompt ? 'Remix Asset' : 'Generate Custom Image'}
          </label>
          {initialPrompt && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Editing from existing
            </span>
          )}
        </div>

        {/* Asset type selector */}
        <div className="flex flex-wrap gap-2 mb-2">
          {ASSET_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              disabled={generating}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                selectedType === type.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              )}
              title={type.description}
            >
              {type.label}
              <span className="ml-1 opacity-60">({type.aspect})</span>
            </button>
          ))}
        </div>

        {/* Transparent background toggle */}
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            role="switch"
            aria-checked={transparentBackground}
            onClick={() => setTransparentBackground(!transparentBackground)}
            disabled={generating}
            className={cn(
              'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed',
              transparentBackground ? 'bg-primary' : 'bg-muted'
            )}
          >
            <span
              className={cn(
                'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow ring-0 transition-transform',
                transparentBackground ? 'translate-x-4' : 'translate-x-0'
              )}
            />
          </button>
          <label className="text-sm text-foreground cursor-pointer" onClick={() => !generating && setTransparentBackground(!transparentBackground)}>
            Transparent Background
          </label>
          <span className="text-xs text-muted-foreground" title="Uses 3 API calls: generates with white background, edits to black, then extracts transparency">
            (slower, 3 API calls)
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCustomGenerate()}
            placeholder={`Describe your ${selectedType}...`}
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            disabled={generating}
          />
          <button
            onClick={handleCustomGenerate}
            disabled={!customPrompt.trim() || generating}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating
              </span>
            ) : (
              'Generate'
            )}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Tip: Include keywords like "background", "icon", "texture" in suggested assets for auto-sizing
        </p>
      </div>

      {/* Suggested assets from idea */}
      {suggestedAssets.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">
              Suggested Assets
            </label>
            {selectedSuggestions.size > 0 && (
              <button
                onClick={handleGenerateSelected}
                disabled={generating}
                className="rounded-md bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 transition-colors"
              >
                Generate {selectedSuggestions.size} Selected
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {suggestedAssets.map((suggestion, i) => {
              const inferredType = inferAssetType(suggestion);
              const aspect = getAspectForType(inferredType);

              return (
                <div
                  key={i}
                  className={cn(
                    'group flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-colors',
                    selectedSuggestions.has(suggestion)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background hover:border-primary/50'
                  )}
                >
                  <button
                    onClick={() => toggleSuggestion(suggestion)}
                    className="mr-1"
                    disabled={generating}
                  >
                      <svg
                        className={cn(
                          'h-4 w-4 transition-colors',
                          selectedSuggestions.has(suggestion) ? 'text-primary' : 'text-muted-foreground'
                        )}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        {selectedSuggestions.has(suggestion) ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        ) : (
                          <circle cx="12" cy="12" r="9" strokeWidth={2} />
                        )}
                      </svg>
                    </button>
                  <span className="truncate max-w-[180px]">{suggestion}</span>
                  <span className="text-xs text-muted-foreground ml-1">({aspect})</span>
                  <button
                    onClick={() => handleGenerateSingle(suggestion)}
                    disabled={generating}
                    className="ml-1 rounded-full p-0.5 opacity-0 group-hover:opacity-100 hover:bg-primary/20 transition-all disabled:opacity-50"
                    title="Generate this asset"
                  >
                    <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {generating && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Generating image with Nano Bananas...
        </div>
      )}
    </div>
  );
}

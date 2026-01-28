import type { Component } from '../../types';

interface SettingsTabProps {
  durationFrames: number;
  fps: number;
  width: number;
  height: number;
  onChange: (settings: Partial<Pick<Component, 'durationFrames' | 'fps' | 'width' | 'height'>>) => void;
}

const FPS_OPTIONS = [24, 30, 60];
const RESOLUTION_PRESETS = [
  { label: '1080p (1920x1080)', width: 1920, height: 1080 },
  { label: '720p (1280x720)', width: 1280, height: 720 },
  { label: '4K (3840x2160)', width: 3840, height: 2160 },
  { label: 'Square (1080x1080)', width: 1080, height: 1080 },
  { label: 'Portrait (1080x1920)', width: 1080, height: 1920 },
  { label: 'Custom', width: 0, height: 0 },
];

export function SettingsTab({ durationFrames, fps, width, height, onChange }: SettingsTabProps) {
  const currentPreset = RESOLUTION_PRESETS.find(
    (p) => p.width === width && p.height === height
  ) ?? RESOLUTION_PRESETS[RESOLUTION_PRESETS.length - 1];

  const durationSeconds = durationFrames / fps;

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Duration */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Duration (frames)</label>
        <input
          type="number"
          value={durationFrames}
          onChange={(e) => onChange({ durationFrames: Math.max(1, parseInt(e.target.value) || 1) })}
          min={1}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="text-xs text-muted-foreground">{durationSeconds.toFixed(2)}s at {fps}fps</p>
      </div>

      {/* FPS */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Frame Rate</label>
        <select
          value={fps}
          onChange={(e) => onChange({ fps: parseInt(e.target.value) })}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {FPS_OPTIONS.map((f) => (
            <option key={f} value={f}>
              {f} fps
            </option>
          ))}
        </select>
      </div>

      {/* Resolution preset */}
      <div className="space-y-1.5 col-span-2">
        <label className="text-sm font-medium text-foreground">Resolution</label>
        <select
          value={currentPreset?.label ?? 'Custom'}
          onChange={(e) => {
            const preset = RESOLUTION_PRESETS.find((p) => p.label === e.target.value);
            if (preset && preset.width > 0) {
              onChange({ width: preset.width, height: preset.height });
            }
          }}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {RESOLUTION_PRESETS.map((p) => (
            <option key={p.label} value={p.label}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Custom width/height */}
      {currentPreset?.width === 0 && (
        <>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Width</label>
            <input
              type="number"
              value={width}
              onChange={(e) => onChange({ width: Math.max(1, parseInt(e.target.value) || 1) })}
              min={1}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Height</label>
            <input
              type="number"
              value={height}
              onChange={(e) => onChange({ height: Math.max(1, parseInt(e.target.value) || 1) })}
              min={1}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useExport } from '../../hooks/useExport';
import type { VideoCodec, AudioCodec, ProResProfile, ExportOptions } from '../../types';

// Codec configuration (mirrored from shared config)
const CODEC_CONFIGS: Record<VideoCodec, {
  label: string;
  extension: string;
  crfRange: { min: number; max: number } | null;
  defaultCrf: number | null;
  audioCodecs: { value: AudioCodec; label: string }[];
}> = {
  h264: {
    label: 'MP4 (H.264)',
    extension: '.mp4',
    crfRange: { min: 1, max: 51 },
    defaultCrf: 18,
    audioCodecs: [
      { value: 'aac', label: 'AAC' },
      { value: 'mp3', label: 'MP3' },
    ],
  },
  h265: {
    label: 'MP4 (H.265/HEVC)',
    extension: '.mp4',
    crfRange: { min: 0, max: 51 },
    defaultCrf: 23,
    audioCodecs: [{ value: 'aac', label: 'AAC' }],
  },
  vp8: {
    label: 'WebM (VP8)',
    extension: '.webm',
    crfRange: { min: 4, max: 63 },
    defaultCrf: 9,
    audioCodecs: [{ value: 'opus', label: 'Opus' }],
  },
  vp9: {
    label: 'WebM (VP9)',
    extension: '.webm',
    crfRange: { min: 0, max: 63 },
    defaultCrf: 28,
    audioCodecs: [{ value: 'opus', label: 'Opus' }],
  },
  prores: {
    label: 'ProRes (MOV)',
    extension: '.mov',
    crfRange: null,
    defaultCrf: null,
    audioCodecs: [
      { value: 'aac', label: 'AAC' },
      { value: 'pcm-16', label: 'PCM 16-bit' },
    ],
  },
};

const PRORES_PROFILES: { value: ProResProfile; label: string }[] = [
  { value: 'proxy', label: 'Proxy' },
  { value: 'light', label: 'LT (Light)' },
  { value: 'standard', label: 'Standard' },
  { value: 'hq', label: 'HQ (High Quality)' },
  { value: '4444', label: '4444' },
  { value: '4444-xq', label: '4444 XQ' },
];

interface ExportModalProps {
  componentId: string;
  componentName: string;
  onClose: () => void;
}

export function ExportModal({ componentId, componentName, onClose }: ExportModalProps) {
  const [codec, setCodec] = useState<VideoCodec>('h264');
  const [crf, setCrf] = useState<number>(18);
  const [audioCodec, setAudioCodec] = useState<AudioCodec>('aac');
  const [proresProfile, setProresProfile] = useState<ProResProfile>('standard');

  const { status, progress, downloadUrl, error, isExporting, startExport, reset } = useExport();

  const config = CODEC_CONFIGS[codec];

  // Update audio codec when video codec changes
  useEffect(() => {
    const newConfig = CODEC_CONFIGS[codec];
    if (newConfig?.audioCodecs && newConfig.audioCodecs.length > 0) {
      setAudioCodec(newConfig.audioCodecs[0].value);
    }
    if (newConfig?.defaultCrf !== null && newConfig?.defaultCrf !== undefined) {
      setCrf(newConfig.defaultCrf);
    }
  }, [codec]);

  // Close on escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isExporting) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose, isExporting]);

  const handleExport = () => {
    const options: ExportOptions = {
      codec,
      audioCodec,
    };

    if (codec !== 'prores' && config.crfRange) {
      options.crf = crf;
    }

    if (codec === 'prores') {
      options.proresProfile = proresProfile;
    }

    startExport(componentId, options);
  };

  const handleClose = () => {
    if (!isExporting) {
      reset();
      onClose();
    }
  };

  const getQualityLabel = (value: number): string => {
    if (!config.crfRange) return '';
    const range = config.crfRange.max - config.crfRange.min;
    const normalized = (value - config.crfRange.min) / range;
    if (normalized < 0.2) return 'Highest';
    if (normalized < 0.4) return 'High';
    if (normalized < 0.6) return 'Medium';
    if (normalized < 0.8) return 'Low';
    return 'Lowest';
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-lg border border-border bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Export Video</h2>
            <p className="text-sm text-muted-foreground">{componentName}</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isExporting}
            className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Display */}
          {status && (
            <div className="space-y-3">
              {isExporting && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {status === 'queued' ? 'Preparing...' : 'Rendering...'}
                    </span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </>
              )}

              {status === 'complete' && downloadUrl && (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">Export complete!</p>
                  <a
                    href={downloadUrl}
                    download
                    className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Video
                  </a>
                </div>
              )}

              {status === 'failed' && error && (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="text-sm text-red-500 text-center">{error}</p>
                  <button
                    onClick={reset}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Try again
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Options (hidden during export) */}
          {!status && (
            <>
              {/* Format */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Format</label>
                <select
                  value={codec}
                  onChange={(e) => setCodec(e.target.value as VideoCodec)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {Object.entries(CODEC_CONFIGS).map(([key, cfg]) => (
                    <option key={key} value={key}>
                      {cfg.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quality (CRF) - only for non-ProRes */}
              {codec !== 'prores' && config.crfRange && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">Quality</label>
                    <span className="text-sm text-muted-foreground">
                      {getQualityLabel(crf)} (CRF: {crf})
                    </span>
                  </div>
                  <input
                    type="range"
                    min={config.crfRange.min}
                    max={config.crfRange.max}
                    value={crf}
                    onChange={(e) => setCrf(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Highest quality</span>
                    <span>Smallest file</span>
                  </div>
                </div>
              )}

              {/* ProRes Profile - only for ProRes */}
              {codec === 'prores' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">ProRes Profile</label>
                  <select
                    value={proresProfile}
                    onChange={(e) => setProresProfile(e.target.value as ProResProfile)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {PRORES_PROFILES.map((profile) => (
                      <option key={profile.value} value={profile.value}>
                        {profile.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Audio Codec */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Audio Codec</label>
                <select
                  value={audioCodec}
                  onChange={(e) => setAudioCodec(e.target.value as AudioCodec)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {config.audioCodecs.map((ac) => (
                    <option key={ac.value} value={ac.value}>
                      {ac.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!status && (
          <div className="border-t border-border px-6 py-4 flex justify-end gap-3">
            <button
              onClick={handleClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Start Export
            </button>
          </div>
        )}

        {/* Close button for completed/failed state */}
        {(status === 'complete' || status === 'failed') && (
          <div className="border-t border-border px-6 py-4 flex justify-end">
            <button
              onClick={handleClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

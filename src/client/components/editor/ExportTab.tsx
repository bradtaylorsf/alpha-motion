import { useState, useEffect } from 'react';
import { useExport } from '../../hooks/useExport';
import type { VideoCodec, AudioCodec, ProResProfile, ExportOptions } from '../../types';

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

interface ExportTabProps {
  componentId: string;
  componentName: string;
}

export function ExportTab({ componentId, componentName: _componentName }: ExportTabProps) {
  const [codec, setCodec] = useState<VideoCodec>('h264');
  const [crf, setCrf] = useState<number>(18);
  const [audioCodec, setAudioCodec] = useState<AudioCodec>('aac');
  const [proresProfile, setProresProfile] = useState<ProResProfile>('standard');

  const { status, progress, downloadUrl, error, isExporting, startExport, reset } = useExport();

  const config = CODEC_CONFIGS[codec];

  useEffect(() => {
    const newConfig = CODEC_CONFIGS[codec];
    if (newConfig?.audioCodecs && newConfig.audioCodecs.length > 0) {
      const firstCodec = newConfig.audioCodecs[0];
      if (firstCodec) {
        setAudioCodec(firstCodec.value);
      }
    }
    if (newConfig?.defaultCrf !== null && newConfig?.defaultCrf !== undefined) {
      setCrf(newConfig.defaultCrf);
    }
  }, [codec]);

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

  // Exporting state
  if (isExporting) {
    return (
      <div className="space-y-3">
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
      </div>
    );
  }

  // Complete state
  if (status === 'complete' && downloadUrl) {
    return (
      <div className="flex flex-col items-center gap-3 py-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 text-green-500">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm text-muted-foreground">Export complete!</p>
        <div className="flex gap-2">
          <a
            href={downloadUrl}
            download
            className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </a>
          <button
            onClick={reset}
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            Export again
          </button>
        </div>
      </div>
    );
  }

  // Failed state
  if (status === 'failed' && error) {
    return (
      <div className="flex flex-col items-center gap-3 py-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-500">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    );
  }

  // Form state
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Format */}
      <div className="space-y-1.5">
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

      {/* Audio Codec */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Audio</label>
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

      {/* Quality (CRF) */}
      {codec !== 'prores' && config.crfRange && (
        <div className="space-y-1.5 col-span-2">
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
        </div>
      )}

      {/* ProRes Profile */}
      {codec === 'prores' && (
        <div className="space-y-1.5 col-span-2">
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

      {/* Export button */}
      <div className="col-span-2">
        <button
          onClick={handleExport}
          className="w-full flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Start Export
        </button>
      </div>
    </div>
  );
}

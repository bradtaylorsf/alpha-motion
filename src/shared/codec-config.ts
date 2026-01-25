// Shared codec configuration for video rendering

export type VideoCodec = 'h264' | 'h265' | 'vp8' | 'vp9' | 'prores';
export type AudioCodec = 'aac' | 'mp3' | 'opus' | 'pcm-16';
export type ProResProfile = 'proxy' | 'light' | 'standard' | 'hq' | '4444' | '4444-xq';

export interface CodecConfig {
  codec: VideoCodec;
  extension: string;
  crfRange: { min: number; max: number } | null;
  defaultCrf: number | null;
  audioCodecs: AudioCodec[];
  defaultAudioCodec: AudioCodec;
}

export const CODEC_CONFIGS: Record<VideoCodec, CodecConfig> = {
  h264: {
    codec: 'h264',
    extension: '.mp4',
    crfRange: { min: 1, max: 51 },
    defaultCrf: 18,
    audioCodecs: ['aac', 'mp3'],
    defaultAudioCodec: 'aac',
  },
  h265: {
    codec: 'h265',
    extension: '.mp4',
    crfRange: { min: 0, max: 51 },
    defaultCrf: 23,
    audioCodecs: ['aac'],
    defaultAudioCodec: 'aac',
  },
  vp8: {
    codec: 'vp8',
    extension: '.webm',
    crfRange: { min: 4, max: 63 },
    defaultCrf: 9,
    audioCodecs: ['opus'],
    defaultAudioCodec: 'opus',
  },
  vp9: {
    codec: 'vp9',
    extension: '.webm',
    crfRange: { min: 0, max: 63 },
    defaultCrf: 28,
    audioCodecs: ['opus'],
    defaultAudioCodec: 'opus',
  },
  prores: {
    codec: 'prores',
    extension: '.mov',
    crfRange: null,
    defaultCrf: null,
    audioCodecs: ['aac', 'pcm-16'],
    defaultAudioCodec: 'aac',
  },
};

export const PRORES_PROFILES: ProResProfile[] = [
  'proxy',
  'light',
  'standard',
  'hq',
  '4444',
  '4444-xq',
];

export const DEFAULT_PRORES_PROFILE: ProResProfile = 'standard';

export interface ExportOptions {
  codec: VideoCodec;
  crf?: number;
  audioCodec?: AudioCodec;
  proresProfile?: ProResProfile;
}

export function getCodecConfig(codec: VideoCodec): CodecConfig {
  return CODEC_CONFIGS[codec];
}

export function getDefaultCrf(codec: VideoCodec): number | null {
  return CODEC_CONFIGS[codec].defaultCrf;
}

export function getExtension(codec: VideoCodec): string {
  return CODEC_CONFIGS[codec].extension;
}

export function isValidCrf(codec: VideoCodec, crf: number): boolean {
  const config = CODEC_CONFIGS[codec];
  if (!config.crfRange) return false;
  return crf >= config.crfRange.min && crf <= config.crfRange.max;
}

export function isValidAudioCodec(codec: VideoCodec, audioCodec: AudioCodec): boolean {
  return CODEC_CONFIGS[codec].audioCodecs.includes(audioCodec);
}

export function getDefaultAudioCodec(codec: VideoCodec): AudioCodec {
  return CODEC_CONFIGS[codec].defaultAudioCodec;
}

// User-friendly labels for display
export const CODEC_LABELS: Record<VideoCodec, string> = {
  h264: 'MP4 (H.264)',
  h265: 'MP4 (H.265/HEVC)',
  vp8: 'WebM (VP8)',
  vp9: 'WebM (VP9)',
  prores: 'ProRes (MOV)',
};

export const AUDIO_CODEC_LABELS: Record<AudioCodec, string> = {
  aac: 'AAC',
  mp3: 'MP3',
  opus: 'Opus',
  'pcm-16': 'PCM 16-bit',
};

export const PRORES_PROFILE_LABELS: Record<ProResProfile, string> = {
  proxy: 'Proxy',
  light: 'LT (Light)',
  standard: 'Standard',
  hq: 'HQ (High Quality)',
  '4444': '4444',
  '4444-xq': '4444 XQ',
};

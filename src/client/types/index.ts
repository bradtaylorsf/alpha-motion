export interface AnimationIdea {
  title: string;
  description: string;
  style: string;
  colors: string[];
  motion: string;
  duration: string;
  elements: string[];
  suggestedAssets: string[];
  detailedPrompt?: string;
}

export interface GenerationSettings {
  durationFrames: number;
  fps: number;
  width: number;
  height: number;
}

export interface PendingIdea {
  id: string;
  idea: AnimationIdea;
  settings: GenerationSettings;
  assets: Asset[];
  createdAt: string | number; // string from API, number from local state
  updatedAt?: string;
}

export interface Component {
  id: string;
  name: string;
  description: string | null;
  promptUsed: string | null;
  ideaJson: AnimationIdea | null;
  sourceCode: string | null;
  tags: string[];
  durationFrames: number;
  fps: number;
  width: number;
  height: number;
  createdAt: string;
  updatedAt: string;
}

export interface GenerationJob {
  jobId: string;
  status: 'queued' | 'generating' | 'complete' | 'failed';
  error?: string;
  component?: Component;
}

// A board item can be a pending idea, generating, completed, or failed
export type BoardItem =
  | { type: 'pending'; data: PendingIdea }
  | { type: 'component'; data: Component }
  | { type: 'generating'; id: string; idea: AnimationIdea; status: 'queued' | 'generating'; startedAt: number }
  | { type: 'failed'; id: string; idea: AnimationIdea; error: string; startedAt: number }

export interface Asset {
  id: string;
  componentId: string | null;
  name: string;
  type: 'generated' | 'uploaded';
  source: 'nano-bananas' | 'local';
  filePath: string;
  promptUsed: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// Video export types
export type VideoCodec = 'h264' | 'h265' | 'vp8' | 'vp9' | 'prores';
export type AudioCodec = 'aac' | 'mp3' | 'opus' | 'pcm-16';
export type ProResProfile = 'proxy' | 'light' | 'standard' | 'hq' | '4444' | '4444-xq';

export interface ExportOptions {
  codec: VideoCodec;
  crf?: number;
  audioCodec?: AudioCodec;
  proresProfile?: ProResProfile;
}

export interface RenderJob {
  id: string;
  componentId: string;
  status: 'queued' | 'rendering' | 'complete' | 'failed';
  progress: number;
  outputPath?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

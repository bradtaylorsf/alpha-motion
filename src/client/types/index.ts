export interface AnimationIdea {
  title: string;
  description: string;
  style: string;
  colors: string[];
  motion: string;
  duration: string;
  elements: string[];
  suggestedAssets: string[];
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

// A board item can be either a completed component or a generation in progress
export type BoardItem =
  | { type: 'component'; data: Component }
  | { type: 'generating'; id: string; idea: AnimationIdea; status: 'queued' | 'generating'; startedAt: number }
  | { type: 'failed'; id: string; idea: AnimationIdea; error: string; startedAt: number }

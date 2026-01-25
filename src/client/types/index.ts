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

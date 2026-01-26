import type { AnimationIdea, Component, GenerationJob, Asset, ExportOptions, RenderJob } from '../types';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.message || error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Ideas API
export async function generateRandomIdea(category?: string): Promise<AnimationIdea> {
  const result = await fetchJson<{ idea: AnimationIdea }>(`${API_BASE}/ideas/random`, {
    method: 'POST',
    body: JSON.stringify({ category }),
  });
  return result.idea;
}

export async function expandIdea(userIdea: string): Promise<AnimationIdea> {
  const result = await fetchJson<{ idea: AnimationIdea }>(`${API_BASE}/ideas/expand`, {
    method: 'POST',
    body: JSON.stringify({ userIdea }),
  });
  return result.idea;
}

// Generation API
export interface GenerationOptions {
  durationFrames?: number;
  fps?: number;
  width?: number;
  height?: number;
  assets?: { id: string; url: string; prompt: string }[];
}

export async function startGeneration(idea: AnimationIdea, options?: GenerationOptions): Promise<string> {
  const result = await fetchJson<{ jobId: string }>(`${API_BASE}/generate`, {
    method: 'POST',
    body: JSON.stringify({ idea, options }),
  });
  return result.jobId;
}

export async function getGenerationStatus(jobId: string): Promise<GenerationJob> {
  return fetchJson<GenerationJob>(`${API_BASE}/generate/${jobId}/status`);
}

// Components API
export async function getComponents(tags?: string[]): Promise<Component[]> {
  const url = tags?.length
    ? `${API_BASE}/components?tags=${tags.join(',')}`
    : `${API_BASE}/components`;
  const result = await fetchJson<{ components: Component[] }>(url);
  return result.components;
}

export async function getComponent(id: string): Promise<Component> {
  return fetchJson<Component>(`${API_BASE}/components/${id}`);
}

export async function getComponentSource(id: string): Promise<string> {
  const response = await fetch(`${API_BASE}/components/${id}/source`);
  if (!response.ok) {
    throw new Error(`Failed to fetch source: ${response.status}`);
  }
  return response.text();
}

export async function updateComponent(
  id: string,
  updates: Partial<Component>
): Promise<Component> {
  return fetchJson<Component>(`${API_BASE}/components/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteComponent(id: string): Promise<void> {
  await fetchJson<{ success: boolean }>(`${API_BASE}/components/${id}`, {
    method: 'DELETE',
  });
}

// Assets API
export interface GenerateAssetOptions {
  model?: string;
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4';
  componentId?: string;
  name?: string;
  transparent?: boolean;
}

export interface BatchGenerateResult {
  assets: Asset[];
  errors?: { prompt: string; error: string }[];
  total: number;
  succeeded: number;
  failed: number;
}

export async function generateAsset(
  prompt: string,
  options?: GenerateAssetOptions
): Promise<Asset> {
  const result = await fetchJson<{ asset: Asset }>(`${API_BASE}/assets/generate`, {
    method: 'POST',
    body: JSON.stringify({ prompt, ...options }),
  });
  return result.asset;
}

export async function generateAssetBatch(
  prompts: string[],
  options?: Omit<GenerateAssetOptions, 'name'>
): Promise<BatchGenerateResult> {
  return fetchJson<BatchGenerateResult>(`${API_BASE}/assets/generate/batch`, {
    method: 'POST',
    body: JSON.stringify({ prompts, ...options }),
  });
}

export interface UploadAssetOptions {
  componentId?: string;
  name?: string;
}

export async function uploadAsset(
  file: File,
  options?: UploadAssetOptions
): Promise<Asset> {
  const formData = new FormData();
  formData.append('image', file);
  if (options?.componentId) {
    formData.append('componentId', options.componentId);
  }
  if (options?.name) {
    formData.append('name', options.name);
  }

  const response = await fetch(`${API_BASE}/assets/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.message || error.error || `HTTP ${response.status}`);
  }

  const result = await response.json();
  return result.asset;
}

export async function getAssets(componentId?: string): Promise<Asset[]> {
  const url = componentId
    ? `${API_BASE}/assets?componentId=${componentId}`
    : `${API_BASE}/assets`;
  const result = await fetchJson<{ assets: Asset[] }>(url);
  return result.assets;
}

export async function getUnlinkedAssets(): Promise<Asset[]> {
  const result = await fetchJson<{ assets: Asset[] }>(`${API_BASE}/assets?unlinked=true`);
  return result.assets;
}

export async function getAsset(id: string): Promise<Asset> {
  return fetchJson<Asset>(`${API_BASE}/assets/${id}`);
}

export async function updateAsset(
  id: string,
  updates: { name?: string; componentId?: string | null }
): Promise<Asset> {
  return fetchJson<Asset>(`${API_BASE}/assets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function linkAssetToComponent(
  assetId: string,
  componentId: string | null
): Promise<Asset> {
  return fetchJson<Asset>(`${API_BASE}/assets/${assetId}/link`, {
    method: 'PUT',
    body: JSON.stringify({ componentId }),
  });
}

export async function deleteAsset(id: string): Promise<void> {
  await fetchJson<{ success: boolean }>(`${API_BASE}/assets/${id}`, {
    method: 'DELETE',
  });
}

export interface EditAssetOptions {
  editPrompt: string;
  model?: string;
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4';
}

export async function editAsset(
  assetId: string,
  options: EditAssetOptions
): Promise<Asset> {
  const result = await fetchJson<{ asset: Asset }>(`${API_BASE}/assets/${assetId}/edit`, {
    method: 'POST',
    body: JSON.stringify(options),
  });
  return result.asset;
}

export interface RemoveBackgroundOptions {
  model?: string;
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4';
}

export async function removeAssetBackground(
  assetId: string,
  options?: RemoveBackgroundOptions
): Promise<Asset> {
  const result = await fetchJson<{ asset: Asset }>(`${API_BASE}/assets/${assetId}/remove-background`, {
    method: 'POST',
    body: JSON.stringify(options || {}),
  });
  return result.asset;
}

// Pending Ideas API
import type { AnimationIdea, GenerationSettings, PendingIdea } from '../types';

export async function createPendingIdea(
  idea: AnimationIdea,
  settings: GenerationSettings,
  assetIds?: string[]
): Promise<PendingIdea> {
  const result = await fetchJson<{ pendingIdea: PendingIdea }>(`${API_BASE}/pending-ideas`, {
    method: 'POST',
    body: JSON.stringify({ idea, settings, assetIds }),
  });
  return result.pendingIdea;
}

export async function getPendingIdeas(): Promise<PendingIdea[]> {
  const result = await fetchJson<{ pendingIdeas: PendingIdea[] }>(`${API_BASE}/pending-ideas`);
  return result.pendingIdeas;
}

export async function getPendingIdea(id: string): Promise<PendingIdea> {
  return fetchJson<PendingIdea>(`${API_BASE}/pending-ideas/${id}`);
}

export async function updatePendingIdea(
  id: string,
  updates: {
    idea?: AnimationIdea;
    settings?: GenerationSettings;
    assetIds?: string[];
  }
): Promise<PendingIdea> {
  return fetchJson<PendingIdea>(`${API_BASE}/pending-ideas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function addAssetToPendingIdea(pendingId: string, assetId: string): Promise<PendingIdea> {
  return fetchJson<PendingIdea>(`${API_BASE}/pending-ideas/${pendingId}/assets`, {
    method: 'POST',
    body: JSON.stringify({ assetId }),
  });
}

export async function removeAssetFromPendingIdea(pendingId: string, assetId: string): Promise<PendingIdea> {
  return fetchJson<PendingIdea>(`${API_BASE}/pending-ideas/${pendingId}/assets/${assetId}`, {
    method: 'DELETE',
  });
}

export async function deletePendingIdea(id: string): Promise<void> {
  await fetchJson<{ success: boolean }>(`${API_BASE}/pending-ideas/${id}`, {
    method: 'DELETE',
  });
}

// Render API
export async function startRender(
  componentId: string,
  options: ExportOptions
): Promise<string> {
  const result = await fetchJson<{ jobId: string }>(`${API_BASE}/render`, {
    method: 'POST',
    body: JSON.stringify({ componentId, options }),
  });
  return result.jobId;
}

export async function getRenderStatus(jobId: string): Promise<RenderJob> {
  return fetchJson<RenderJob>(`${API_BASE}/render/${jobId}/status`);
}

// Edit/Remix API
export interface EditGenerationJob {
  jobId: string;
  status: 'queued' | 'generating' | 'complete' | 'failed';
  type: 'edit' | 'remix';
  error?: string;
  component?: Component;
}

export async function startEditComponent(
  componentId: string,
  instructions: string
): Promise<string> {
  const result = await fetchJson<{ jobId: string }>(`${API_BASE}/generate/edit`, {
    method: 'POST',
    body: JSON.stringify({ componentId, instructions }),
  });
  return result.jobId;
}

export async function startRemixComponent(
  componentId: string,
  instructions: string
): Promise<string> {
  const result = await fetchJson<{ jobId: string }>(`${API_BASE}/generate/remix`, {
    method: 'POST',
    body: JSON.stringify({ componentId, instructions }),
  });
  return result.jobId;
}

export async function getEditGenerationStatus(jobId: string): Promise<EditGenerationJob> {
  return fetchJson<EditGenerationJob>(`${API_BASE}/generate/edit/${jobId}/status`);
}

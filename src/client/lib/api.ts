import type { AnimationIdea, Component, GenerationJob, Asset } from '../types';

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

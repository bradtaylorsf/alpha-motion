import type { AnimationIdea, Component, GenerationJob } from '../types';

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
export async function startGeneration(idea: AnimationIdea): Promise<string> {
  const result = await fetchJson<{ jobId: string }>(`${API_BASE}/generate`, {
    method: 'POST',
    body: JSON.stringify({ idea }),
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

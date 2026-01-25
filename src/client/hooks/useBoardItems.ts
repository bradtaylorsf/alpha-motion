import { useState, useCallback, useRef, useEffect } from 'react';
import {
  startGeneration,
  getGenerationStatus,
  generateRandomIdea,
  expandIdea,
  getAssets,
  getPendingIdeas,
  createPendingIdea as apiCreatePendingIdea,
  updatePendingIdea as apiUpdatePendingIdea,
  addAssetToPendingIdea as apiAddAssetToPendingIdea,
  removeAssetFromPendingIdea as apiRemoveAssetFromPendingIdea,
  deletePendingIdea as apiDeletePendingIdea,
} from '../lib/api';
import { useComponents } from './useComponents';
import type { AnimationIdea, GenerationSettings, PendingIdea, Asset, BoardItem, Component } from '../types';

const POLL_INTERVAL = 2000;

const DEFAULT_SETTINGS: GenerationSettings = {
  durationFrames: 150,
  fps: 30,
  width: 1920,
  height: 1080,
};

interface GeneratingJob {
  id: string;
  jobId: string;
  idea: AnimationIdea;
  settings: GenerationSettings;
  assets: Asset[];
  status: 'queued' | 'generating';
  startedAt: number;
}

interface FailedJob {
  id: string;
  idea: AnimationIdea;
  error: string;
  startedAt: number;
}

export function useBoardItems() {
  const { components, loading: componentsLoading, deleteComponent, addComponent, fetchComponents } = useComponents();
  const [pendingIdeas, setPendingIdeas] = useState<PendingIdea[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [generatingJobs, setGeneratingJobs] = useState<GeneratingJob[]>([]);
  const [failedJobs, setFailedJobs] = useState<FailedJob[]>([]);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Fetch pending ideas from API on mount
  const fetchPendingIdeas = useCallback(async () => {
    try {
      const ideas = await getPendingIdeas();
      setPendingIdeas(ideas);
    } catch (e) {
      console.error('Failed to fetch pending ideas:', e);
    } finally {
      setPendingLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingIdeas();
  }, [fetchPendingIdeas]);

  const stopPolling = useCallback((id: string) => {
    const timeout = pollRefs.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      pollRefs.current.delete(id);
    }
  }, []);

  const stopAllPolling = useCallback(() => {
    pollRefs.current.forEach((timeout) => clearTimeout(timeout));
    pollRefs.current.clear();
  }, []);

  const pollStatus = useCallback(async (id: string, jobId: string) => {
    try {
      const result = await getGenerationStatus(jobId);

      if (result.status === 'complete' && result.component) {
        // Remove from generating, add to components
        setGeneratingJobs((prev) => prev.filter((j) => j.id !== id));
        addComponent(result.component);
        stopPolling(id);
      } else if (result.status === 'failed') {
        // Move to failed jobs
        setGeneratingJobs((prev) => {
          const job = prev.find((j) => j.id === id);
          if (job) {
            setFailedJobs((failedPrev) => [
              { id: job.id, idea: job.idea, error: result.error || 'Generation failed', startedAt: job.startedAt },
              ...failedPrev,
            ]);
          }
          return prev.filter((j) => j.id !== id);
        });
        stopPolling(id);
      } else {
        // Update status and continue polling
        setGeneratingJobs((prev) =>
          prev.map((j) =>
            j.id === id ? { ...j, status: result.status as 'queued' | 'generating' } : j
          )
        );
        pollRefs.current.set(id, setTimeout(() => pollStatus(id, jobId), POLL_INTERVAL));
      }
    } catch (e) {
      // Move to failed jobs
      setGeneratingJobs((prev) => {
        const job = prev.find((j) => j.id === id);
        if (job) {
          setFailedJobs((failedPrev) => [
            { id: job.id, idea: job.idea, error: e instanceof Error ? e.message : 'Failed to check status', startedAt: job.startedAt },
            ...failedPrev,
          ]);
        }
        return prev.filter((j) => j.id !== id);
      });
      stopPolling(id);
    }
  }, [addComponent, stopPolling]);

  // Create a pending idea (saves to DB immediately)
  const createPendingIdea = useCallback(async (idea: AnimationIdea): Promise<PendingIdea> => {
    const pending = await apiCreatePendingIdea(idea, DEFAULT_SETTINGS, []);
    setPendingIdeas((prev) => [pending, ...prev]);
    return pending;
  }, []);

  // Remix an existing component - creates a new pending idea with its settings
  // Uses optimistic UI: returns immediately, fetches assets in background
  const remixComponent = useCallback(async (component: Component): Promise<PendingIdea> => {
    // Build the idea from component data
    const idea: AnimationIdea = component.ideaJson || {
      title: `${component.name} (Remix)`,
      description: component.description || '',
      style: '',
      colors: [],
      motion: '',
      duration: `${Math.round(component.durationFrames / component.fps)}s`,
      elements: [],
      suggestedAssets: [],
    };

    // Use the component's settings
    const settings: GenerationSettings = {
      durationFrames: component.durationFrames,
      fps: component.fps,
      width: component.width,
      height: component.height,
    };

    // Create pending idea immediately WITHOUT assets (optimistic)
    const pending = await apiCreatePendingIdea(
      { ...idea, title: `${idea.title} (Remix)` },
      settings,
      [] // Start with no assets - will load in background
    );

    setPendingIdeas((prev) => [pending, ...prev]);

    // Fetch assets in background and update the pending idea
    getAssets(component.id)
      .then(async (componentAssets) => {
        if (componentAssets.length > 0) {
          // Add each asset to the pending idea
          for (const asset of componentAssets) {
            try {
              await apiAddAssetToPendingIdea(pending.id, asset.id);
            } catch (e) {
              console.error('Failed to add asset to pending idea:', e);
            }
          }
          // Update local state with all assets
          setPendingIdeas((prev) =>
            prev.map((p) =>
              p.id === pending.id ? { ...p, assets: componentAssets } : p
            )
          );
        }
      })
      .catch((e) => {
        console.error('Failed to fetch component assets for remix:', e);
      });

    return pending;
  }, []);

  // Update a pending idea (saves to DB)
  const updatePendingIdea = useCallback(async (id: string, idea: AnimationIdea, settings: GenerationSettings) => {
    try {
      const updated = await apiUpdatePendingIdea(id, { idea, settings });
      setPendingIdeas((prev) =>
        prev.map((p) => (p.id === id ? updated : p))
      );
    } catch (e) {
      console.error('Failed to update pending idea:', e);
    }
  }, []);

  // Add asset to pending idea (saves to DB)
  const addAssetToPendingIdea = useCallback(async (pendingId: string, asset: Asset) => {
    try {
      const updated = await apiAddAssetToPendingIdea(pendingId, asset.id);
      setPendingIdeas((prev) =>
        prev.map((p) => (p.id === pendingId ? updated : p))
      );
    } catch (e) {
      console.error('Failed to add asset to pending idea:', e);
      // Fallback to local update
      setPendingIdeas((prev) =>
        prev.map((p) => (p.id === pendingId ? { ...p, assets: [asset, ...p.assets] } : p))
      );
    }
  }, []);

  // Remove asset from pending idea (saves to DB)
  const removeAssetFromPendingIdea = useCallback(async (pendingId: string, assetId: string) => {
    try {
      const updated = await apiRemoveAssetFromPendingIdea(pendingId, assetId);
      setPendingIdeas((prev) =>
        prev.map((p) => (p.id === pendingId ? updated : p))
      );
    } catch (e) {
      console.error('Failed to remove asset from pending idea:', e);
      // Fallback to local update
      setPendingIdeas((prev) =>
        prev.map((p) =>
          p.id === pendingId ? { ...p, assets: p.assets.filter((a) => a.id !== assetId) } : p
        )
      );
    }
  }, []);

  // Delete a pending idea (deletes from DB)
  const deletePendingIdea = useCallback(async (id: string) => {
    try {
      await apiDeletePendingIdea(id);
      setPendingIdeas((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error('Failed to delete pending idea:', e);
    }
  }, []);

  // Start generation from a pending idea (with assets)
  const startGenerationFromPending = useCallback(async (
    pendingId: string,
    idea: AnimationIdea,
    settings: GenerationSettings,
    assets: Asset[]
  ) => {
    const id = `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startedAt = Date.now();

    // Remove from pending (both local state and DB)
    setPendingIdeas((prev) => prev.filter((p) => p.id !== pendingId));
    apiDeletePendingIdea(pendingId).catch((e) => {
      console.error('Failed to delete pending idea from DB:', e);
    });

    // Add to generating jobs
    setGeneratingJobs((prev) => [
      { id, jobId: '', idea, settings, assets, status: 'queued', startedAt },
      ...prev,
    ]);

    try {
      // Pass assets to generation with IDs for linking
      const jobId = await startGeneration(idea, {
        ...settings,
        assets: assets.map((a) => ({
          id: a.id,
          url: a.filePath,
          prompt: a.promptUsed || a.name,
        })),
      });
      // Update with actual job ID and start polling
      setGeneratingJobs((prev) =>
        prev.map((j) => (j.id === id ? { ...j, jobId, status: 'generating' } : j))
      );
      pollRefs.current.set(id, setTimeout(() => pollStatus(id, jobId), POLL_INTERVAL));
    } catch (e) {
      // Move to failed jobs
      setGeneratingJobs((prev) => prev.filter((j) => j.id !== id));
      setFailedJobs((prev) => [
        { id, idea, error: e instanceof Error ? e.message : 'Failed to start generation', startedAt },
        ...prev,
      ]);
    }
  }, [pollStatus]);

  // Generate random ideas (creates pending ideas, saves to DB)
  const generateRandomIdeas = useCallback(async (count: number = 1) => {
    setIsGeneratingIdeas(true);
    setError(null);

    try {
      const promises = Array(count).fill(null).map(async () => {
        const idea = await generateRandomIdea();
        await createPendingIdea(idea);
      });
      await Promise.all(promises);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate ideas');
    } finally {
      setIsGeneratingIdeas(false);
    }
  }, [createPendingIdea]);

  // Expand user input into a pending idea (saves to DB)
  const expandAndCreatePending = useCallback(async (userInput: string) => {
    setIsGeneratingIdeas(true);
    setError(null);

    try {
      const idea = await expandIdea(userInput);
      await createPendingIdea(idea);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to expand idea');
    } finally {
      setIsGeneratingIdeas(false);
    }
  }, [createPendingIdea]);

  const retryFailed = useCallback(async (id: string) => {
    const failedJob = failedJobs.find((j) => j.id === id);
    if (failedJob) {
      setFailedJobs((prev) => prev.filter((j) => j.id !== id));
      // Create a new pending idea from the failed job
      await createPendingIdea(failedJob.idea);
    }
  }, [failedJobs, createPendingIdea]);

  const dismissFailed = useCallback((id: string) => {
    setFailedJobs((prev) => prev.filter((j) => j.id !== id));
  }, []);

  // Combine all items, sorted by time (most recent first)
  const boardItems: BoardItem[] = [
    ...pendingIdeas.map((pending): BoardItem => ({
      type: 'pending',
      data: pending,
    })),
    ...generatingJobs.map((job): BoardItem => ({
      type: 'generating',
      id: job.id,
      idea: job.idea,
      status: job.status,
      startedAt: job.startedAt,
    })),
    ...failedJobs.map((job): BoardItem => ({
      type: 'failed',
      id: job.id,
      idea: job.idea,
      error: job.error,
      startedAt: job.startedAt,
    })),
    ...components.map((c): BoardItem => ({
      type: 'component',
      data: c,
    })),
  ];

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAllPolling();
  }, [stopAllPolling]);

  return {
    boardItems,
    pendingIdeas,
    loading: componentsLoading || pendingLoading,
    error,
    isGeneratingIdeas,
    generateRandomIdeas,
    expandAndCreatePending,
    createPendingIdea,
    updatePendingIdea,
    deletePendingIdea,
    addAssetToPendingIdea,
    removeAssetFromPendingIdea,
    startGenerationFromPending,
    remixComponent,
    deleteComponent,
    retryFailed,
    dismissFailed,
    refetch: fetchComponents,
  };
}

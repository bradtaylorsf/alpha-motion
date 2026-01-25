import { useState, useCallback, useRef, useEffect } from 'react';
import { startGeneration, getGenerationStatus, generateRandomIdea, expandIdea } from '../lib/api';
import { useComponents } from './useComponents';
import type { AnimationIdea, Component, BoardItem } from '../types';

const POLL_INTERVAL = 2000;

interface GeneratingJob {
  id: string;
  jobId: string;
  idea: AnimationIdea;
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
  const [generatingJobs, setGeneratingJobs] = useState<GeneratingJob[]>([]);
  const [failedJobs, setFailedJobs] = useState<FailedJob[]>([]);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

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

  const startGenerationJob = useCallback(async (idea: AnimationIdea) => {
    const id = `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startedAt = Date.now();

    // Add to generating jobs immediately
    setGeneratingJobs((prev) => [
      { id, jobId: '', idea, status: 'queued', startedAt },
      ...prev,
    ]);

    try {
      const jobId = await startGeneration(idea);
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

  const generateRandomIdeas = useCallback(async (count: number = 1) => {
    setIsGeneratingIdeas(true);
    setError(null);

    try {
      const promises = Array(count).fill(null).map(async () => {
        const idea = await generateRandomIdea();
        await startGenerationJob(idea);
      });
      await Promise.all(promises);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate ideas');
    } finally {
      setIsGeneratingIdeas(false);
    }
  }, [startGenerationJob]);

  const expandAndGenerate = useCallback(async (userInput: string) => {
    setIsGeneratingIdeas(true);
    setError(null);

    try {
      const idea = await expandIdea(userInput);
      await startGenerationJob(idea);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to expand idea');
    } finally {
      setIsGeneratingIdeas(false);
    }
  }, [startGenerationJob]);

  const retryFailed = useCallback(async (id: string) => {
    const failedJob = failedJobs.find((j) => j.id === id);
    if (failedJob) {
      setFailedJobs((prev) => prev.filter((j) => j.id !== id));
      await startGenerationJob(failedJob.idea);
    }
  }, [failedJobs, startGenerationJob]);

  const dismissFailed = useCallback((id: string) => {
    setFailedJobs((prev) => prev.filter((j) => j.id !== id));
  }, []);

  // Combine all items, sorted by time (most recent first)
  const boardItems: BoardItem[] = [
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
    loading: componentsLoading,
    error,
    isGeneratingIdeas,
    generateRandomIdeas,
    expandAndGenerate,
    deleteComponent,
    retryFailed,
    dismissFailed,
    refetch: fetchComponents,
  };
}

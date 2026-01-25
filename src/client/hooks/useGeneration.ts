import { useState, useCallback, useRef, useEffect } from 'react';
import { startGeneration, getGenerationStatus } from '../lib/api';
import type { AnimationIdea, Component, GenerationJob } from '../types';

const POLL_INTERVAL = 2000; // 2 seconds

export function useGeneration() {
  const [status, setStatus] = useState<GenerationJob['status'] | null>(null);
  const [component, setComponent] = useState<Component | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearTimeout(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const pollStatus = useCallback(async (jobId: string) => {
    try {
      const result = await getGenerationStatus(jobId);
      setStatus(result.status);

      if (result.status === 'complete' && result.component) {
        setComponent(result.component);
        stopPolling();
      } else if (result.status === 'failed') {
        setError(result.error || 'Generation failed');
        stopPolling();
      } else {
        // Continue polling
        pollRef.current = setTimeout(() => pollStatus(jobId), POLL_INTERVAL);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to check status');
      stopPolling();
    }
  }, [stopPolling]);

  const generate = useCallback(async (idea: AnimationIdea) => {
    stopPolling();
    setStatus('queued');
    setComponent(null);
    setError(null);

    try {
      const jobId = await startGeneration(idea);
      setStatus('generating');
      // Start polling
      pollRef.current = setTimeout(() => pollStatus(jobId), POLL_INTERVAL);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start generation');
      setStatus(null);
    }
  }, [pollStatus, stopPolling]);

  const reset = useCallback(() => {
    stopPolling();
    setStatus(null);
    setComponent(null);
    setError(null);
  }, [stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return {
    status,
    component,
    error,
    isGenerating: status === 'queued' || status === 'generating',
    generate,
    reset,
  };
}

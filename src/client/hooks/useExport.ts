import { useState, useCallback, useRef, useEffect } from 'react';
import { startRender, getRenderStatus } from '../lib/api';
import type { ExportOptions, RenderJob } from '../types';

const POLL_INTERVAL = 1000; // 1 second

export function useExport() {
  const [status, setStatus] = useState<RenderJob['status'] | null>(null);
  const [progress, setProgress] = useState(0);
  const [outputPath, setOutputPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearTimeout(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const pollStatus = useCallback(async (jobId: string) => {
    try {
      const result = await getRenderStatus(jobId);
      setStatus(result.status);
      setProgress(result.progress);

      if (result.status === 'complete' && result.outputPath) {
        setOutputPath(result.outputPath);
        stopPolling();
      } else if (result.status === 'failed') {
        setError(result.error || 'Render failed');
        stopPolling();
      } else {
        // Continue polling
        pollRef.current = setTimeout(() => pollStatus(jobId), POLL_INTERVAL);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to check render status');
      stopPolling();
    }
  }, [stopPolling]);

  const startExport = useCallback(async (componentId: string, options: ExportOptions) => {
    stopPolling();
    setStatus('queued');
    setProgress(0);
    setOutputPath(null);
    setError(null);

    try {
      const jobId = await startRender(componentId, options);
      setStatus('rendering');
      // Start polling
      pollRef.current = setTimeout(() => pollStatus(jobId), POLL_INTERVAL);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start render');
      setStatus(null);
    }
  }, [pollStatus, stopPolling]);

  const reset = useCallback(() => {
    stopPolling();
    setStatus(null);
    setProgress(0);
    setOutputPath(null);
    setError(null);
  }, [stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return {
    status,
    progress,
    outputPath,
    error,
    isExporting: status === 'queued' || status === 'rendering',
    startExport,
    reset,
  };
}

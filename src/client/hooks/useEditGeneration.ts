import { useState, useCallback, useRef, useEffect } from 'react';
import { startEditComponent, startRemixComponent, getEditGenerationStatus } from '../lib/api';
import type { Component } from '../types';

const POLL_INTERVAL = 2000; // 2 seconds

type EditStatus = 'queued' | 'generating' | 'complete' | 'failed' | null;

export function useEditGeneration() {
  const [editStatus, setEditStatus] = useState<EditStatus>(null);
  const [remixStatus, setRemixStatus] = useState<EditStatus>(null);
  const [editedComponent, setEditedComponent] = useState<Component | null>(null);
  const [remixedComponent, setRemixedComponent] = useState<Component | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearTimeout(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const pollStatus = useCallback(async (jobId: string, type: 'edit' | 'remix') => {
    try {
      const result = await getEditGenerationStatus(jobId);
      const setStatus = type === 'edit' ? setEditStatus : setRemixStatus;
      const setComponent = type === 'edit' ? setEditedComponent : setRemixedComponent;

      setStatus(result.status);

      if (result.status === 'complete' && result.component) {
        setComponent(result.component);
        stopPolling();
      } else if (result.status === 'failed') {
        setError(result.error || `${type === 'edit' ? 'Edit' : 'Remix'} failed`);
        stopPolling();
      } else {
        // Continue polling
        pollRef.current = setTimeout(() => pollStatus(jobId, type), POLL_INTERVAL);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to check status');
      stopPolling();
    }
  }, [stopPolling]);

  const edit = useCallback(async (componentId: string, instructions: string) => {
    stopPolling();
    setEditStatus('queued');
    setEditedComponent(null);
    setError(null);

    try {
      const jobId = await startEditComponent(componentId, instructions);
      setEditStatus('generating');
      // Start polling
      pollRef.current = setTimeout(() => pollStatus(jobId, 'edit'), POLL_INTERVAL);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start edit');
      setEditStatus(null);
    }
  }, [pollStatus, stopPolling]);

  const remix = useCallback(async (componentId: string, instructions: string) => {
    stopPolling();
    setRemixStatus('queued');
    setRemixedComponent(null);
    setError(null);

    try {
      const jobId = await startRemixComponent(componentId, instructions);
      setRemixStatus('generating');
      // Start polling
      pollRef.current = setTimeout(() => pollStatus(jobId, 'remix'), POLL_INTERVAL);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start remix');
      setRemixStatus(null);
    }
  }, [pollStatus, stopPolling]);

  const reset = useCallback(() => {
    stopPolling();
    setEditStatus(null);
    setRemixStatus(null);
    setEditedComponent(null);
    setRemixedComponent(null);
    setError(null);
  }, [stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return {
    edit,
    remix,
    isEditing: editStatus === 'queued' || editStatus === 'generating',
    isRemixing: remixStatus === 'queued' || remixStatus === 'generating',
    editStatus,
    remixStatus,
    editedComponent,
    remixedComponent,
    error,
    reset,
  };
}

import { useState, useCallback } from 'react';
import { generateRandomIdea, expandIdea } from '../lib/api';
import type { AnimationIdea } from '../types';

export function useIdeas() {
  const [idea, setIdea] = useState<AnimationIdea | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateRandom = useCallback(async (category?: string) => {
    setLoading(true);
    setError(null);
    try {
      const newIdea = await generateRandomIdea(category);
      setIdea(newIdea);
      return newIdea;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to generate idea';
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const expand = useCallback(async (userIdea: string) => {
    setLoading(true);
    setError(null);
    try {
      const newIdea = await expandIdea(userIdea);
      setIdea(newIdea);
      return newIdea;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to expand idea';
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearIdea = useCallback(() => {
    setIdea(null);
    setError(null);
  }, []);

  return {
    idea,
    loading,
    error,
    generateRandom,
    expand,
    clearIdea,
  };
}

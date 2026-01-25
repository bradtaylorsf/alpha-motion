import { useState, useCallback, useEffect } from 'react';
import {
  getComponents,
  getComponent,
  updateComponent as apiUpdateComponent,
  deleteComponent as apiDeleteComponent,
} from '../lib/api';
import type { Component } from '../types';

export function useComponents() {
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComponents = useCallback(async (tags?: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getComponents(tags);
      setComponents(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch components');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchComponent = useCallback(async (id: string) => {
    try {
      return await getComponent(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch component');
      return null;
    }
  }, []);

  const updateComponent = useCallback(
    async (id: string, updates: Partial<Component>) => {
      try {
        const updated = await apiUpdateComponent(id, updates);
        setComponents((prev) =>
          prev.map((c) => (c.id === id ? updated : c))
        );
        return updated;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to update component');
        return null;
      }
    },
    []
  );

  const deleteComponent = useCallback(async (id: string) => {
    try {
      await apiDeleteComponent(id);
      setComponents((prev) => prev.filter((c) => c.id !== id));
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete component');
      return false;
    }
  }, []);

  const addComponent = useCallback((component: Component) => {
    setComponents((prev) => [component, ...prev]);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchComponents();
  }, [fetchComponents]);

  return {
    components,
    loading,
    error,
    fetchComponents,
    fetchComponent,
    updateComponent,
    deleteComponent,
    addComponent,
  };
}

import { useState, useCallback, useEffect } from 'react';
import {
  getAssets,
  getAsset,
  generateAsset as apiGenerateAsset,
  generateAssetBatch as apiGenerateAssetBatch,
  updateAsset as apiUpdateAsset,
  deleteAsset as apiDeleteAsset,
  linkAssetToComponent as apiLinkAssetToComponent,
  type GenerateAssetOptions,
} from '../lib/api';
import type { Asset } from '../types';

export function useAssets(componentId?: string) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = useCallback(async (filterComponentId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAssets(filterComponentId);
      setAssets(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAsset = useCallback(async (id: string) => {
    try {
      return await getAsset(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch asset');
      return null;
    }
  }, []);

  const generateAsset = useCallback(
    async (prompt: string, options?: GenerateAssetOptions) => {
      setGenerating(true);
      setError(null);
      try {
        const asset = await apiGenerateAsset(prompt, options);
        setAssets((prev) => [asset, ...prev]);
        return asset;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to generate asset');
        return null;
      } finally {
        setGenerating(false);
      }
    },
    []
  );

  const generateFromSuggestions = useCallback(
    async (
      suggestedAssets: string[],
      options?: Omit<GenerateAssetOptions, 'name'>
    ) => {
      if (suggestedAssets.length === 0) return { assets: [], errors: [] };

      setGenerating(true);
      setError(null);
      try {
        const result = await apiGenerateAssetBatch(suggestedAssets, options);
        if (result.assets.length > 0) {
          setAssets((prev) => [...result.assets, ...prev]);
        }
        return result;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to generate assets');
        return { assets: [], errors: [{ prompt: 'batch', error: String(e) }] };
      } finally {
        setGenerating(false);
      }
    },
    []
  );

  const updateAsset = useCallback(
    async (id: string, updates: { name?: string; componentId?: string | null }) => {
      try {
        const updated = await apiUpdateAsset(id, updates);
        setAssets((prev) => prev.map((a) => (a.id === id ? updated : a)));
        return updated;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to update asset');
        return null;
      }
    },
    []
  );

  const linkToComponent = useCallback(
    async (assetId: string, targetComponentId: string | null) => {
      try {
        const updated = await apiLinkAssetToComponent(assetId, targetComponentId);
        setAssets((prev) => prev.map((a) => (a.id === assetId ? updated : a)));
        return updated;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to link asset');
        return null;
      }
    },
    []
  );

  const deleteAsset = useCallback(async (id: string) => {
    try {
      await apiDeleteAsset(id);
      setAssets((prev) => prev.filter((a) => a.id !== id));
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete asset');
      return false;
    }
  }, []);

  const addAsset = useCallback((asset: Asset) => {
    setAssets((prev) => [asset, ...prev]);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchAssets(componentId);
  }, [fetchAssets, componentId]);

  return {
    assets,
    loading,
    generating,
    error,
    fetchAssets,
    fetchAsset,
    generateAsset,
    generateFromSuggestions,
    updateAsset,
    linkToComponent,
    deleteAsset,
    addAsset,
  };
}

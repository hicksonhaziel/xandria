import { useEffect, useState, useCallback } from 'react';
import { useAppContext } from '@/app/context/AppContext'; 
import type { PNode, ApiResponse } from '@/app/types';

interface UsePNodesOptions {
  refreshInterval?: number;
  autoRefresh?: boolean;
}

export function usePNodes(options: UsePNodesOptions = {}) {
  const { refreshInterval = 30000, autoRefresh = true } = options;
  const { network } = useAppContext(); 
  
  const [pNodes, setPNodes] = useState<PNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  const fetchPNodes = useCallback(async (isRefresh = false) => {
    if (!isRefresh) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);

    try {
      const res = await fetch(`/api/pnodes?network=${network}`);
      if (!res.ok) throw new Error(res.statusText);
      
      const result: ApiResponse = await res.json();
      if (!result.success) {
        throw new Error(result.message || result.error || 'Failed to fetch pNodes');
      }

      setPNodes(result.data);
      setLastUpdate(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [network]);

  useEffect(() => {
    fetchPNodes(false);
  }, [fetchPNodes]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchPNodes(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchPNodes]);

  const refresh = useCallback(() => {
    fetchPNodes(true);
  }, [fetchPNodes]);

  return { 
    pNodes, 
    loading, 
    refreshing,
    error, 
    lastUpdate,
    refresh 
  };
}
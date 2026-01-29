import { useState, useEffect, useCallback } from 'react';
import type { PNodeDetailResponse } from '@/app/types/pnode-detail';

interface UsePNodeInfoOptions {
  refreshInterval?: number; 
  autoRefresh?: boolean;
  enabled?: boolean;
}

export function usePNodeInfo( 
  pubkey: string,
  network: 'devnet' | 'mainnet' = 'devnet',
  options: UsePNodeInfoOptions = {}
) {
  const { refreshInterval = 30000, autoRefresh = true, enabled = true } = options;
  
  const [data, setData] = useState<PNodeDetailResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  const fetchPNode = useCallback(async (isRefresh = false) => {
    if (!pubkey) return;

    // Only show loading on initial fetch
    if (!isRefresh) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    
    setError(null);

    try {
      const res = await fetch(`/api/pnodes/${pubkey}?network=${network}`);
      const json: PNodeDetailResponse = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.data?.toString() || 'Failed to fetch pNode');
      }

      setData(json.data);
      setLastUpdate(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pubkey, network]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
    fetchPNode(false);
  }
  }, [fetchPNode, enabled]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh || !pubkey || !enabled) return;

    const interval = setInterval(() => {
      fetchPNode(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, pubkey, refreshInterval, fetchPNode, enabled]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchPNode(true);
  }, [fetchPNode]);

  return { 
    data, 
    loading, 
    refreshing, 
    error, 
    lastUpdate,
    refresh 
  };
}
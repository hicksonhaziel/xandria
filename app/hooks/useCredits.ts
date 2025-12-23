// app/hooks/useCredits.ts

import { useState, useEffect } from 'react';

export interface NodeCredits {
  pubkey: string;
  id: string;
  credits: number;
  balance: number;
  rank: number;
  monthlyEarned?: number;
  earnedThisMonth?: number;
  lastUpdated?: string;
}

export interface CreditsResponse {
  nodes: NodeCredits[];
  totalNodes: number;
  lastUpdate: string;
  timestamp: number;
}

interface UseCreditsOptions {
  refreshInterval?: number; // in milliseconds
  autoRefresh?: boolean;
}

export function useCredits(options: UseCreditsOptions = {}) {
  const { refreshInterval = 60000, autoRefresh = true } = options;
  
  const [data, setData] = useState<CreditsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchCredits = async () => {
    try {
      setError(null);
      
      const response = await fetch('https://podcredits.xandeum.network/api/pods-credits');
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const jsonData = await response.json();
      
      // Transform data to match our interface
      // Adjust based on actual API response structure
      const transformedData: CreditsResponse = {
        nodes: Array.isArray(jsonData) 
          ? jsonData 
          : jsonData.nodes || [],
        totalNodes: jsonData.totalNodes || jsonData.nodes?.length || 0,
        lastUpdate: jsonData.lastUpdate || new Date().toISOString(),
        timestamp: Date.now(),
      };

      setData(transformedData);
      setLastFetch(new Date());
    } catch (err) {
      console.error('Error fetching credits:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch credits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();

    if (autoRefresh) {
      const interval = setInterval(fetchCredits, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  return {
    data,
    loading,
    error,
    lastFetch,
    refresh: fetchCredits,
  };
}

// Hook to get credits for a specific node
export function useNodeCredits(nodePubkey: string, options: UseCreditsOptions = {}) {
  const { data, loading, error, lastFetch, refresh } = useCredits(options);
  
  const nodeCredits = data?.nodes.find(
    (node) => node.pubkey === nodePubkey || node.id === nodePubkey
  );

  return {
    credits: nodeCredits,
    loading,
    error,
    lastFetch,
    refresh,
    totalNodes: data?.totalNodes,
  };
}
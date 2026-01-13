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
  network: 'devnet' | 'mainnet';
}

interface UseCreditsOptions {
  refreshInterval?: number;
  autoRefresh?: boolean;
  network?: 'devnet' | 'mainnet';
}

export function useCredits(options: UseCreditsOptions = {}) {
  const { refreshInterval = 60000, autoRefresh = true, network = 'devnet' } = options;
  
  const [data, setData] = useState<CreditsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchCredits = async () => {
    try {
      setError(null);
      
      console.log(`Fetching ${network} credits from API...`);
      
      const response = await fetch(`/api/pods-credits?network=${network}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) { 
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const jsonData = await response.json();
      console.log('API Response:', jsonData);
      
      if (!jsonData.pods_credits) {
        throw new Error('Invalid API response: pods_credits not found');
      }
      
      const podsCredits = jsonData.pods_credits;
      
      if (!Array.isArray(podsCredits)) {
        throw new Error('Invalid API response: pods_credits is not an array');
      }
      
      const sortedPods = [...podsCredits].sort((a, b) => b.credits - a.credits);
      
      const nodes: NodeCredits[] = sortedPods.map((pod, index) => ({
        pubkey: pod.pod_id,
        id: pod.pod_id,
        credits: pod.credits || 0,
        balance: pod.credits || 0,
        rank: index + 1,
        lastUpdated: new Date().toISOString(),
      }));

      const transformedData: CreditsResponse = {
        nodes,
        totalNodes: nodes.length,
        lastUpdate: new Date().toISOString(),
        timestamp: Date.now(),
        network: jsonData.network || network,
      };

      console.log('Transformed data:', transformedData);
      
      setData(transformedData);
      setLastFetch(new Date());
    } catch (err) {
      console.error('Error fetching credits:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch credits';
      console.error('Error details:', errorMessage);
      setError(errorMessage);
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
  }, [autoRefresh, refreshInterval, network]);

  return {
    data,
    loading,
    error,
    lastFetch,
    refresh: fetchCredits,
    network,
  };
}

export function useNodeCredits(
  nodePubkey: string, 
  options: UseCreditsOptions = {}
) {
  const { data, loading, error, lastFetch, refresh, network } = useCredits(options);
  
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
    network,
  };
}
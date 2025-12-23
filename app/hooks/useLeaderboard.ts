// hooks/useLeaderboard.ts
import { useState, useEffect, useCallback } from 'react';

interface LeaderboardEntry {
  pubkey: string;
  score: number;
  uptime: number;
  storage: number;
  status: string;
  version: string;
  rank: number;
}

interface LeaderboardResponse {
  success: boolean;
  data: LeaderboardEntry[];
  total: number;
  cached: boolean;
  timestamp: number;
}

interface UseLeaderboardOptions {
  limit?: number;
  refreshInterval?: number;
  autoRefresh?: boolean;
}

export function useLeaderboard(options: UseLeaderboardOptions = {}) {
  const { limit = 100, refreshInterval = 30000, autoRefresh = true } = options;
  
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const [cached, setCached] = useState(false);

  const fetchLeaderboard = useCallback(async (isRefresh = false) => {
    if (!isRefresh) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    
    setError(null);

    try {
      const res = await fetch(`/api/leaderboard?limit=${limit}`);
      const json: LeaderboardResponse = await res.json();

      if (!res.ok || !json.success) {
        throw new Error('Failed to fetch leaderboard');
      }

      setData(json.data);
      setCached(json.cached);
      setLastUpdate(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchLeaderboard(false);
  }, [fetchLeaderboard]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchLeaderboard(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchLeaderboard]);

  const refresh = useCallback(() => {
    fetchLeaderboard(true);
  }, [fetchLeaderboard]);

  return { 
    data, 
    loading, 
    refreshing,
    error, 
    lastUpdate,
    cached,
    refresh 
  };
}
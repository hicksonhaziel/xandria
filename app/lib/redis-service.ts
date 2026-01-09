export const runtime = "nodejs";
import { redis } from '@/app/lib/redis';

const CACHE_TTL = 60; // 1 minute for leaderboard
const METRICS_TTL = 172800; // 48 hours for node metrics
const NODE_SCORE_TTL = 60 * 5; // 5 minutes

interface NodeMetrics {
  pubkey: string;
  timestamp: number;
  ramUsage: number;
  cpuUsage: number;
  networkIO: number;
}

interface LeaderboardEntry {
  pubkey: string;
  score: number;
  uptime: number;
  storage: number;
  rank: number;
}


export class RedisService {
  // Helper to safely parse data from Redis
  private static parseRedisData<T>(data: any): T | null {
    if (!data) return null;
    
    // If it's already an object, return it
    if (typeof data === 'object' && data !== null) {
      return data as T;
    }
    
    // If it's a string, try to parse it
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch {
        return null;
      }
    }
    
    return null;
  }

  // Cache leaderboard data
  static async cacheLeaderboard(entries: LeaderboardEntry[]) {
    const key = 'leaderboard:global';
    try {
      await redis.set(key, JSON.stringify(entries), { ex: CACHE_TTL });
    } catch (error) {
      console.error('Failed to cache leaderboard:', error);
    }
  }

  static async getLeaderboard(): Promise<LeaderboardEntry[] | null> {
    try {
      const data = await redis.get('leaderboard:global');
      return this.parseRedisData<LeaderboardEntry[]>(data);
    } catch (error) {
      console.error('Failed to get leaderboard from cache:', error);
      return null;
    }
  }

  // Store node metrics with 48h retention
  static async storeNodeMetrics(pubkey: string, metrics: Omit<NodeMetrics, 'pubkey' | 'timestamp'>) {
    const timestamp = Date.now();
    const key = `metrics:${pubkey}`;
    
    const data: NodeMetrics = {
      pubkey,
      timestamp,
      ...metrics
    };

    try {
      await redis.zadd(key, { score: timestamp, member: JSON.stringify(data) });
      await redis.expire(key, METRICS_TTL);
      
      // Remove old entries beyond 48h
      const cutoff = timestamp - METRICS_TTL * 1000;
      await redis.zremrangebyscore(key, 0, cutoff);
    } catch (error) {
      console.error('Failed to store node metrics:', error);
    }
  }

  static async getNodeMetrics(pubkey: string, limit = 100): Promise<NodeMetrics[]> {
    const key = `metrics:${pubkey}`;
    try {
      const data = await redis.zrange(key, 0, limit - 1, { rev: true });
      
      if (!Array.isArray(data)) return [];
      
      return data.map(item => {
        try {
          return JSON.parse(item as string);
        } catch {
          return null;
        }
      }).filter((item): item is NodeMetrics => item !== null);
    } catch (error) {
      console.error('Failed to get node metrics:', error);
      return [];
    }
  }

  // Cache individual node data
  static async cacheNode(pubkey: string, nodeData: any) {
    const key = `node:${pubkey}`;
    try {
      await redis.set(key, JSON.stringify(nodeData), { ex: CACHE_TTL });
    } catch (error) {
      console.error('Failed to cache node:', error);
    }
  }

  static async getNode(pubkey: string) {
    try {
      const data = await redis.get(`node:${pubkey}`);
      return this.parseRedisData(data);
    } catch (error) {
      console.error('Failed to get node from cache:', error);
      return null;
    }
  }

  // Cache all nodes
  static async cacheAllNodes(nodes: any[]) {
    try {
      await redis.set('nodes:all', JSON.stringify(nodes), { ex: CACHE_TTL });
    } catch (error) {
      console.error('Failed to cache all nodes:', error);
    }
  }

  static async getAllNodes() {
    try {
      const data = await redis.get('nodes:all');
      return this.parseRedisData(data);
    } catch (error) {
      console.error('Failed to get all nodes from cache:', error);
      return null;
    }
  }

  // Track last update timestamp
  static async setLastUpdate() {
    try {
      await redis.set('lastUpdate', Date.now().toString());
    } catch (error) {
      console.error('Failed to set last update:', error);
    }
  }

  static async getLastUpdate(): Promise<number | null> {
    try {
      const timestamp = await redis.get('lastUpdate');
      return timestamp ? Number(timestamp) : null;
    } catch (error) {
      console.error('Failed to get last update:', error);
      return null;
    }
  }

  // Network stats cache
  static async cacheNetworkStats(stats: any) {
    try {
      await redis.set('stats:network', JSON.stringify(stats), { ex: CACHE_TTL });
    } catch (error) {
      console.error('Failed to cache network stats:', error);
    }
  }

  static async getNetworkStats() {
    try {
      const data = await redis.get('stats:network');
      return this.parseRedisData(data);
    } catch (error) {
      console.error('Failed to get network stats from cache:', error);
      return null;
    }
  }

  static async cacheNodeScore(pubkey: string, score: number) {
    await redis.set(
      `node:score:${pubkey}`,
      score.toString(),
      { ex: NODE_SCORE_TTL }
    );
  }

  static async getNodeScore(pubkey: string): Promise<number | null> {
    const value = await redis.get(`node:score:${pubkey}`);
    return value ? Number(value) : null;
  }
}
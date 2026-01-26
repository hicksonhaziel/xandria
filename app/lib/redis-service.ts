export const runtime = "nodejs";
import { redis } from '@/app/lib/redis';
import type { NetworkType } from '@/app/lib/prpc';

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

  // Cache leaderboard data with network support
  static async cacheLeaderboard(entries: LeaderboardEntry[], network: NetworkType = 'devnet') {
    const key = `leaderboard:${network}`;
    try {
      await redis.set(key, JSON.stringify(entries), { ex: CACHE_TTL });
    } catch (error) {
      console.error(`Failed to cache ${network} leaderboard:`, error);
    }
  }

  static async getLeaderboard(network: NetworkType = 'devnet'): Promise<LeaderboardEntry[] | null> {
    try {
      const data = await redis.get(`leaderboard:${network}`);
      return this.parseRedisData<LeaderboardEntry[]>(data);
    } catch (error) {
      console.error(`Failed to get ${network} leaderboard from cache:`, error);
      return null;
    }
  }

  // Store node metrics with 48h retention (network-specific)
  static async storeNodeMetrics(
    pubkey: string, 
    metrics: Omit<NodeMetrics, 'pubkey' | 'timestamp'>,
    network: NetworkType = 'devnet'
  ) {
    const timestamp = Date.now();
    const key = `metrics:${network}:${pubkey}`;
    
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
      console.error(`Failed to store ${network} node metrics:`, error);
    }
  }

  static async getNodeMetrics(
    pubkey: string, 
    network: NetworkType = 'devnet',
    limit = 100
  ): Promise<NodeMetrics[]> {
    const key = `metrics:${network}:${pubkey}`;
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
      console.error(`Failed to get ${network} node metrics:`, error);
      return [];
    }
  }

  // Cache individual node data (network-specific)
  static async cacheNode(pubkey: string, nodeData: any, network: NetworkType = 'devnet') {
    const key = `node:${network}:${pubkey}`;
    try {
      await redis.set(key, JSON.stringify(nodeData), { ex: CACHE_TTL });
    } catch (error) {
      console.error(`Failed to cache ${network} node:`, error);
    }
  }

  static async getNode(pubkey: string, network: NetworkType = 'devnet') {
    try {
      const data = await redis.get(`node:${network}:${pubkey}`);
      return this.parseRedisData(data);
    } catch (error) {
      console.error(`Failed to get ${network} node from cache:`, error);
      return null;
    }
  }

  // Cache all nodes (network-specific)
  static async cacheAllNodes(nodes: any[], network: NetworkType = 'devnet') {
    try {
      await redis.set(`nodes:${network}`, JSON.stringify(nodes), { ex: CACHE_TTL });
    } catch (error) {
      console.error(`Failed to cache ${network} nodes:`, error);
    }
  }

  static async getAllNodes(network: NetworkType = 'devnet') {
    try {
      const data = await redis.get(`nodes:${network}`);
      return this.parseRedisData(data);
    } catch (error) {
      console.error(`Failed to get ${network} nodes from cache:`, error);
      return null;
    }
  }

  // Track last update timestamp (network-specific)
  static async setLastUpdate(network: NetworkType = 'devnet') {
    try {
      await redis.set(`lastUpdate:${network}`, Date.now().toString());
    } catch (error) {
      console.error(`Failed to set ${network} last update:`, error);
    }
  }

  static async getLastUpdate(network: NetworkType = 'devnet'): Promise<number | null> {
    try {
      const timestamp = await redis.get(`lastUpdate:${network}`);
      return timestamp ? Number(timestamp) : null;
    } catch (error) {
      console.error(`Failed to get ${network} last update:`, error);
      return null;
    }
  }

  // Network stats cache (network-specific)
  static async cacheNetworkStats(stats: any, network: NetworkType = 'devnet') {
    try {
      await redis.set(`stats:${network}`, JSON.stringify(stats), { ex: CACHE_TTL });
    } catch (error) {
      console.error(`Failed to cache ${network} stats:`, error);
    }
  }

  static async getNetworkStats(network: NetworkType = 'devnet') {
    try {
      const data = await redis.get(`stats:${network}`);
      return this.parseRedisData(data);
    } catch (error) {
      console.error(`Failed to get ${network} stats from cache:`, error);
      return null;
    }
  }

  // Node score cache (network-specific)
  static async cacheNodeScore(pubkey: string, score: number, network: NetworkType = 'devnet') {
    try {
      await redis.set(
        `node:score:${network}:${pubkey}`,
        score.toString(),
        { ex: NODE_SCORE_TTL }
      );
    } catch (error) {
      console.error(`Failed to cache ${network} node score:`, error);
    }
  }

  static async getNodeScore(pubkey: string, network: NetworkType = 'devnet'): Promise<number | null> {
    try {
      const value = await redis.get(`node:score:${network}:${pubkey}`);
      return value ? Number(value) : null;
    } catch (error) {
      console.error(`Failed to get ${network} node score:`, error);
      return null;
    }
  }

  // Utility methods for cross-network operations
  
  /**
   * Get combined stats across both networks
   */
  static async getAllNetworkStats() {
    const [devnetStats, mainnetStats] = await Promise.all([
      this.getNetworkStats('devnet'),
      this.getNetworkStats('mainnet'),
    ]);

    return {
      devnet: devnetStats,
      mainnet: mainnetStats,
    };
  }

  /**
   * Clear all cache for a specific network
   */
  static async clearNetworkCache(network: NetworkType) {
    try {
      const pattern = `*:${network}*`;
      // Note: This is a simple approach. For production, consider using SCAN
      // to avoid blocking Redis with KEYS command on large datasets
      const keys = await redis.keys(pattern);
      
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      
      console.log(`Cleared ${keys.length} cache entries for ${network}`);
    } catch (error) {
      console.error(`Failed to clear ${network} cache:`, error);
    }
  }

  /**
   * Clear all caches (both networks)
   */
  static async clearAllCaches() {
    await Promise.all([
      this.clearNetworkCache('devnet'),
      this.clearNetworkCache('mainnet'),
    ]);
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats() {
    try {
      const [devnetNodes, mainnetNodes, devnetStats, mainnetStats] = await Promise.all([
        redis.get('nodes:devnet'),
        redis.get('nodes:mainnet'),
        redis.get('stats:devnet'),
        redis.get('stats:mainnet'),
      ]);

      return {
        devnet: {
          nodesCache: !!devnetNodes,
          statsCache: !!devnetStats,
          lastUpdate: await this.getLastUpdate('devnet'),
        },
        mainnet: {
          nodesCache: !!mainnetNodes,
          statsCache: !!mainnetStats,
          lastUpdate: await this.getLastUpdate('mainnet'),
        },
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return null;
    }
  }
}
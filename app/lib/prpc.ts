import axios, { AxiosError } from 'axios';
import type { PNode, ApiResponse } from '@/app/types';

/**
 * Raw RPC response structure from the Xandeum cluster endpoint
 */
interface PRPCResponse {
  jsonrpc: string;
  id: number;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  result: {
    pods: RawPod[];
  };
}

/**
 * Raw pod data structure returned by the RPC endpoint
 */
interface RawPod {
  pubkey: string;
  version?: string;
  uptime?: number;
  last_seen_timestamp?: number;
  address?: string;
  rpc_port?: number;
  is_public?: boolean;
  storage_committed?: number;
  storage_used?: number;
  storage_usage_percent?: number;
}

/**
 * Extended PNode with optional private flag and detailed RPC response
 */
export interface PNodeWithDetails extends PNode {
  private?: boolean;
  details?: any;
}

/**
 * Cache entry structure for cluster data
 */
interface CacheEntry {
  data: PNode[];
  timestamp: number;
}

/**
 * Configuration for the pRPC client
 */
interface PRPCClientConfig {
  endpoint: string;
  timeout?: number;
  cacheTTL?: number;
  detailsTimeout?: number;
}

/**
 * pRPC Client for Xandeum cluster communication
 * 
 * Handles:
 * - Fetching cluster node information
 * - Caching responses to reduce network load
 * - Error handling and retry logic
 * - Individual node detail fetching for public nodes
 */
class PRPCClient {
  private readonly endpoint: string;
  private readonly timeout: number;
  private readonly detailsTimeout: number;
  private readonly cache: Map<string, CacheEntry>;
  private readonly cacheTTL: number;

  /**
   * Initialize the pRPC client
   * @param config Client configuration options
   */
  constructor(config: PRPCClientConfig) {
    this.endpoint = config.endpoint.replace(/\/$/, '');
    this.timeout = config.timeout ?? 8000; // 8s default for cluster calls
    this.detailsTimeout = config.detailsTimeout ?? 3000; // 3s for individual node calls
    this.cacheTTL = config.cacheTTL ?? 30000; // 30s cache TTL
    this.cache = new Map();
  }

  /**
   * Fetch all cluster nodes with statistics
   * 
   * Implements caching to reduce unnecessary network calls.
   * Cache is automatically invalidated after TTL expires.
   * 
   * @returns Promise resolving to array of parsed PNode objects
   */
  async getClusterNodes(): Promise<PNode[]> {
    // Check cache first
    const cached = this.cache.get('cluster');
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    try {
      const response = await axios.post<PRPCResponse>(
        this.endpoint,
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'get-pods-with-stats',
          params: [],
        },
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Handle RPC-level errors
      if (response.data.error) {
        console.error('[pRPC] RPC error:', response.data.error);
        return [];
      }

      // Parse and cache the result
      const pods = response.data?.result?.pods ?? [];
      const parsed = this.parsePNodes(pods);
      
      this.cache.set('cluster', { 
        data: parsed, 
        timestamp: Date.now() 
      });
      
      return parsed;
    } catch (error) {
      this.handleRPCError('getClusterNodes', error);
      return [];
    }
  }

  /**
   * Fetch detailed information for a specific node by pubkey
   * 
   * For public nodes, attempts to fetch additional details from their
   * individual RPC endpoint. For private nodes, returns basic info only.
   * 
   * @param pubkey Public key of the node to query
   * @returns Promise resolving to PNodeWithDetails or null if not found
   */
  async getPNodeInfo(pubkey: string): Promise<PNodeWithDetails | null> {
    const allPods = await this.getClusterNodes();
    const normalizedPubkey = pubkey.trim().toLowerCase();

    // Find the matching pod
    const pod = allPods.find(
      p => p.pubkey.trim().toLowerCase() === normalizedPubkey
    );

    if (!pod) {
      console.warn(`[pRPC] Pod not found: ${pubkey}`);
      return null;
    }

    // Return basic info for private nodes
    if (!pod.isPublic) {
      return {
        ...pod,
        private: true,
      };
    }

    // Fetch detailed info for public nodes
    return this.fetchPublicPodDetails(pod);
  }

  /**
   * Fetch detailed statistics from a public node's RPC endpoint
   * 
   * Non-blocking: failures return basic node info without details
   * 
   * @param pod The PNode to fetch details for
   * @returns Promise resolving to PNodeWithDetails
   */
  private async fetchPublicPodDetails(pod: PNode): Promise<PNodeWithDetails> {
    // Validate required RPC connection info
    if (!pod.ipAddress || !pod.rpcPort) {
      console.warn(`[pRPC] Invalid RPC info for pod ${pod.pubkey}`);
      return {
        ...pod,
        private: false,
        details: null,
      };
    }

    try {
      const rpcEndpoint = `http://${pod.ipAddress}:${pod.rpcPort}/rpc`;
      
      const response = await axios.post(
        rpcEndpoint,
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'get-stats',
          params: [],
        },
        {
          timeout: this.detailsTimeout,
          headers: {
            'Content-Type': 'application/json',
          },
          validateStatus: (status) => status < 500,
        }
      );

      return {
        ...pod,
        private: false,
        details: response.data,
      };
    } catch (error) {
      // Non-critical error: log and return basic info
      if (axios.isAxiosError(error)) {
        console.warn(
          `[pRPC] Failed to fetch details for ${pod.pubkey}: ${error.message}`
        );
      }
      
      return {
        ...pod,
        private: false,
        details: null,
      };
    }
  }

  /**
   * Parse an array of raw pod data from RPC response
   * 
   * Filters out any pods that fail validation or parsing
   * 
   * @param data Array of raw pod objects
   * @returns Array of successfully parsed PNode objects
   */
  private parsePNodes(data: any[]): PNode[] {
    if (!Array.isArray(data)) {
      console.error('[pRPC] Invalid pods data: expected array');
      return [];
    }

    return data
      .map(pod => this.parsePNode(pod))
      .filter((p): p is PNode => p !== null);
  }

  /**
   * Parse a single raw pod object into a PNode
   * 
   * Validates required fields and applies sensible defaults
   * for missing optional fields.
   * 
   * @param data Raw pod data from RPC
   * @returns Parsed PNode or null if validation fails
   */
  private parsePNode(data: RawPod): PNode | null {
    try {
      // Validate required field
      if (!data.pubkey) {
        console.warn('[pRPC] Pod missing pubkey, skipping');
        return null;
      }

      // Extract IP address from address field (format: "ip:port")
      const [ip = ''] = (data.address || '').split(':');

      return {
        id: `pnode-${data.pubkey.slice(0, 8)}`,
        pubkey: data.pubkey,
        version: data.version || 'unknown',
        responseTime: 0, // Populated by external scoring logic
        status: this.determineStatus(data.last_seen_timestamp),
        uptime: Math.max(0, data.uptime || 0),
        lastSeen: data.last_seen_timestamp
          ? data.last_seen_timestamp * 1000 // Convert to milliseconds
          : Date.now(),
        rpcPort: Math.max(0, data.rpc_port || 0),
        ipAddress: ip,
        isPublic: Boolean(data.is_public),
        storageCommitted: Math.max(0, data.storage_committed || 0),
        storageUsed: Math.max(0, data.storage_used || 0),
        storageUsagePercent: Math.min(
          100,
          Math.max(0, data.storage_usage_percent || 0)
        ),
      };
    } catch (error) {
      console.error('[pRPC] Failed to parse pod:', error);
      return null;
    }
  }

  /**
   * Determine node status based on last seen timestamp
   * 
   * Status thresholds:
   * - active: seen within last 60 seconds
   * - syncing: seen within last 5 minutes
   * - offline: not seen for 5+ minutes
   * 
   * @param lastSeenSeconds Unix timestamp in seconds
   * @returns Node status enum value
   */
  private determineStatus(lastSeenSeconds?: number): PNode['status'] {
    if (!lastSeenSeconds) return 'offline';

    const ageMs = Date.now() - lastSeenSeconds * 1000;

    if (ageMs < 60_000) return 'active';    // < 1 minute
    if (ageMs < 300_000) return 'syncing';  // < 5 minutes
    return 'offline';
  }

  /**
   * Centralized error handling for RPC calls
   * 
   * Logs detailed error information to console for debugging
   * 
   * @param method Name of the method that failed
   * @param error The error object
   */
  private handleRPCError(method: string, error: unknown): void {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.code === 'ECONNREFUSED') {
        console.error(`[pRPC] ${method}: Connection refused to ${this.endpoint}`);
      } else if (axiosError.code === 'ETIMEDOUT') {
        console.error(`[pRPC] ${method}: Request timeout to ${this.endpoint}`);
      } else if (axiosError.code === 'ECONNABORTED') {
        console.error(`[pRPC] ${method}: Request aborted to ${this.endpoint}`);
      } else {
        console.error(
          `[pRPC] ${method}: ${axiosError.message}`,
          axiosError.response?.data
        );
      }
    } else {
      console.error(`[pRPC] ${method}: Unknown error`, error);
    }
  }

  /**
   * Clear the internal cache
   * 
   * Useful for testing or forcing a fresh fetch
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * 
   * @returns Object with cache hit/miss info
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

/**
 * Singleton pRPC client instance
 * 
 * Uses environment variable for RPC endpoint with fallback
 */
export const prpcClient = new PRPCClient({
  endpoint: process.env.NEXT_PUBLIC_XANDEUM_RPC_ENDPOINT || 
            'http://173.212.203.145:6000/rpc',
  timeout: 8000,
  cacheTTL: 30000,
  detailsTimeout: 3000,
});
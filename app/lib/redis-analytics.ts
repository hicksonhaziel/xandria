import { redis } from './redis'

interface NodeMetrics {
  timestamp: number
  uptime: number
  score: number
  xanScore?: number
  storageCommitted?: number
  storageUsed?: number
  storageUsagePercent?: number
  ramTotal?: number
  ramUsed?: number
  ramPercent?: number
  cpuPercent?: number
}

interface PodCredits {
  timestamp: number
  credits: number
  podId: string
}

const SEVEN_DAYS_TTL = 7 * 24 * 60 * 60 // 7 days in seconds
const TWO_MONTHS_TTL = 60 * 24 * 60 * 60 // 60 days in seconds

export class RedisAnalyticsService {
  // Store node metrics snapshot
  static async storeNodeMetrics(
    pubkey: string,
    metrics: Omit<NodeMetrics, 'timestamp'>
  ): Promise<void> {
    const timestamp = Date.now()
    const key = `node:metrics:${pubkey}`
    
    const snapshot: NodeMetrics = {
      timestamp,
      ...metrics
    }

    // Single command with ZADD and expiration handled separately
    await redis.zadd(key, {
      score: timestamp,
      member: JSON.stringify(snapshot)
    })
    await redis.expire(key, TWO_MONTHS_TTL)
  }

  // Store pod credits snapshot
  static async storePodCredits(
    podId: string,
    credits: number
  ): Promise<void> {
    const timestamp = Date.now()
    const key = `pod:credits:${podId}`
    
    const snapshot: PodCredits = {
      timestamp,
      credits,
      podId
    }

    await redis.zadd(key, {
      score: timestamp,
      member: JSON.stringify(snapshot)
    })

    await redis.expire(key, TWO_MONTHS_TTL)
  }

  // Get historical metrics for a node
  static async getNodeHistory(
    pubkey: string,
    startTime?: number,
    endTime?: number
  ): Promise<NodeMetrics[]> {
    const key = `node:metrics:${pubkey}`
    const end = endTime || Date.now()
    const start = startTime || (end - SEVEN_DAYS_TTL * 1000)

    const data = await redis.zrange(key, start, end, {
      byScore: true,
    })
    
    if (!data || data.length === 0) return []

    return data.map((item) => {
      if (typeof item === 'string') {
        return JSON.parse(item) as NodeMetrics
      }
      return item as NodeMetrics
    })
  }

  // Get historical credits for a pod
  static async getPodCreditsHistory(
    podId: string,
    startTime?: number,
    endTime?: number
  ): Promise<PodCredits[]> {
    const key = `pod:credits:${podId}`
    const end = endTime || Date.now()
    const start = startTime || (end - SEVEN_DAYS_TTL * 1000)

    const data = await redis.zrange(key, start, end, {
      byScore: true,
    })
    
    if (!data || data.length === 0) return []

    return data.map((item) => {
      if (typeof item === 'string') {
        return JSON.parse(item) as PodCredits
      }
      return item as PodCredits
    })
  }

  // Get latest metrics for a node
  static async getLatestNodeMetrics(pubkey: string): Promise<NodeMetrics | null> {
    const key = `node:metrics:${pubkey}`
    const data = await redis.zrange(key, -1, -1)
    
    if (!data || data.length === 0) return null
    
    const item = data[0]
    if (typeof item === 'string') {
      return JSON.parse(item) as NodeMetrics
    }
    return item as NodeMetrics
  }

  // Get latest credits for a pod
  static async getLatestPodCredits(podId: string): Promise<PodCredits | null> {
    const key = `pod:credits:${podId}`
    const data = await redis.zrange(key, -1, -1)
    
    if (!data || data.length === 0) return null
    
    const item = data[0]
    if (typeof item === 'string') {
      return JSON.parse(item) as PodCredits
    }
    return item as PodCredits
  }

  // Get credits change over time period
  static async getPodCreditsChange(
    podId: string,
    timePeriod: '10min' | '7days' = '10min'
  ): Promise<{ current: number; previous: number; change: number; percentChange: number } | null> {
    const now = Date.now()
    const periodMs = timePeriod === '10min' ? 10 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000
    const startTime = now - periodMs

    const history = await this.getPodCreditsHistory(podId, startTime, now)
    
    if (history.length === 0) return null

    const current = history[history.length - 1].credits
    const previous = history[0].credits
    const change = current - previous
    const percentChange = previous > 0 ? ((change / previous) * 100) : 0

    return { current, previous, change, percentChange }
  }

  
  static async batchStoreNodeMetrics(
    nodes: Array<{ pubkey: string; metrics: Omit<NodeMetrics, 'timestamp'> }>
  ): Promise<void> {
    if (nodes.length === 0) return
    
    const pipeline = redis.pipeline()
    const timestamp = Date.now()

    // Only ZADD - expiration is set once during initialization
    for (const { pubkey, metrics } of nodes) {
      const key = `node:metrics:${pubkey}`
      const snapshot: NodeMetrics = { timestamp, ...metrics }

      pipeline.zadd(key, {
        score: timestamp,
        member: JSON.stringify(snapshot)
      })
    }

    await pipeline.exec()
  }

  
  static async batchStorePodCredits(
    pods: Array<{ podId: string; credits: number }>
  ): Promise<void> {
    if (pods.length === 0) return
    
    const pipeline = redis.pipeline()
    const timestamp = Date.now()

    for (const { podId, credits } of pods) {
      const key = `pod:credits:${podId}`
      const snapshot: PodCredits = { timestamp, credits, podId }

      pipeline.zadd(key, {
        score: timestamp,
        member: JSON.stringify(snapshot)
      })
    }

    await pipeline.exec()
  }

  //  Initialize expiration for all keys (run once, or when adding new nodes)
  static async initializeExpirations(): Promise<void> {
    const nodeKeys = await redis.keys('node:metrics:*')
    const podKeys = await redis.keys('pod:credits:*')
    
    const pipeline = redis.pipeline()
    
    for (const key of nodeKeys) {
      pipeline.expire(key, TWO_MONTHS_TTL)
    }
    
    for (const key of podKeys) {
      pipeline.expire(key, TWO_MONTHS_TTL)
    }
    
    await pipeline.exec()
  }

  // Run cleanup 
  static async cleanupOldData(): Promise<void> {
    
    const sevenDaysAgo = Date.now() - (SEVEN_DAYS_TTL * 1000)
    
    // Get all node keys
    const nodeKeys = await redis.keys('node:metrics:*')
    const podKeys = await redis.keys('pod:credits:*')
    
    const pipeline = redis.pipeline()
    
    // Clean up old entries from all keys
    for (const key of nodeKeys) {
      pipeline.zremrangebyscore(key, '-inf', sevenDaysAgo)
    }
    
    for (const key of podKeys) {
      pipeline.zremrangebyscore(key, '-inf', sevenDaysAgo)
    }
    
    await pipeline.exec()
  }

  // Get all tracked node pubkeys
  static async getAllTrackedNodes(): Promise<string[]> {
    const keys = await redis.keys('node:metrics:*')
    return keys.map(key => key.replace('node:metrics:', ''))
  }

  // Get all tracked pod IDs
  static async getAllTrackedPods(): Promise<string[]> {
    const keys = await redis.keys('pod:credits:*')
    return keys.map(key => key.replace('pod:credits:', ''))
  }
}
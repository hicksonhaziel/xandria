// lib/redis-analytics.ts
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

    // Add to sorted set with timestamp as score
    await redis.zadd(key, {
      score: timestamp,
      member: JSON.stringify(snapshot)
    })

    // Set expiration to 2 months
    await redis.expire(key, TWO_MONTHS_TTL)

    // Clean up old entries (older than 7 days)
    const sevenDaysAgo = timestamp - (SEVEN_DAYS_TTL * 1000)
    await redis.zremrangebyscore(key, 0, sevenDaysAgo)
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

    // Clean up old entries (older than 7 days)
    const sevenDaysAgo = timestamp - (SEVEN_DAYS_TTL * 1000)
    await redis.zremrangebyscore(key, 0, sevenDaysAgo)
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

    const data = await redis.zrangebyscore(key, start, end)
    
    return data.map((item) => JSON.parse(item as string)) as NodeMetrics[]
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

    const data = await redis.zrangebyscore(key, start, end)
    
    return data.map((item) => JSON.parse(item as string)) as PodCredits[]
  }

  // Get latest metrics for a node
  static async getLatestNodeMetrics(pubkey: string): Promise<NodeMetrics | null> {
    const key = `node:metrics:${pubkey}`
    const data = await redis.zrange(key, -1, -1)
    
    if (!data || data.length === 0) return null
    
    return JSON.parse(data[0] as string) as NodeMetrics
  }

  // Get latest credits for a pod
  static async getLatestPodCredits(podId: string): Promise<PodCredits | null> {
    const key = `pod:credits:${podId}`
    const data = await redis.zrange(key, -1, -1)
    
    if (!data || data.length === 0) return null
    
    return JSON.parse(data[0] as string) as PodCredits
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

  // Batch store multiple nodes (for cron job efficiency)
  static async batchStoreNodeMetrics(
    nodes: Array<{ pubkey: string; metrics: Omit<NodeMetrics, 'timestamp'> }>
  ): Promise<void> {
    const pipeline = redis.pipeline()
    const timestamp = Date.now()
    const sevenDaysAgo = timestamp - (SEVEN_DAYS_TTL * 1000)

    for (const { pubkey, metrics } of nodes) {
      const key = `node:metrics:${pubkey}`
      const snapshot: NodeMetrics = { timestamp, ...metrics }

      pipeline.zadd(key, {
        score: timestamp,
        member: JSON.stringify(snapshot)
      })
      pipeline.expire(key, TWO_MONTHS_TTL)
      pipeline.zremrangebyscore(key, 0, sevenDaysAgo)
    }

    await pipeline.exec()
  }

  // Batch store multiple pod credits (for cron job efficiency)
  static async batchStorePodCredits(
    pods: Array<{ podId: string; credits: number }>
  ): Promise<void> {
    const pipeline = redis.pipeline()
    const timestamp = Date.now()
    const sevenDaysAgo = timestamp - (SEVEN_DAYS_TTL * 1000)

    for (const { podId, credits } of pods) {
      const key = `pod:credits:${podId}`
      const snapshot: PodCredits = { timestamp, credits, podId }

      pipeline.zadd(key, {
        score: timestamp,
        member: JSON.stringify(snapshot)
      })
      pipeline.expire(key, TWO_MONTHS_TTL)
      pipeline.zremrangebyscore(key, 0, sevenDaysAgo)
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
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!)

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

type Network = 'devnet' | 'mainnet'

export class DBAnalyticsService {
  // Store node metrics
  static async storeNodeMetrics(
    network: Network,
    pubkey: string,
    metrics: Omit<NodeMetrics, 'timestamp'>
  ): Promise<void> {
    const timestamp = Date.now()
    const table = network === 'mainnet' ? 'mainnet_node_metrics' : 'devnet_node_metrics'

    await sql`
      INSERT INTO ${sql(table)} (
        pubkey, timestamp, uptime, score, xan_score,
        storage_committed, storage_used, storage_usage_percent,
        ram_total, ram_used, ram_percent, cpu_percent
      ) VALUES (
        ${pubkey}, ${timestamp}, ${metrics.uptime}, ${metrics.score}, ${metrics.xanScore ?? null},
        ${metrics.storageCommitted ?? null}, ${metrics.storageUsed ?? null}, ${metrics.storageUsagePercent ?? null},
        ${metrics.ramTotal ?? null}, ${metrics.ramUsed ?? null}, ${metrics.ramPercent ?? null}, ${metrics.cpuPercent ?? null}
      )
    `
  }

  // Store pod credits
  static async storePodCredits(
    network: Network,
    podId: string,
    credits: number
  ): Promise<void> {
    const timestamp = Date.now()
    const table = network === 'mainnet' ? 'mainnet_pod_credits' : 'devnet_pod_credits'

    await sql`
      INSERT INTO ${sql(table)} (pod_id, timestamp, credits)
      VALUES (${podId}, ${timestamp}, ${credits})
    `
  }

  // Get node history
  static async getNodeHistory(
    network: Network,
    pubkey: string,
    startTime?: number,
    endTime?: number,
    limit?: number
  ): Promise<NodeMetrics[]> {
    const table = network === 'mainnet' ? 'mainnet_node_metrics' : 'devnet_node_metrics'
    const end = endTime || Date.now()
    const start = startTime || 0

    const results = await sql`
      SELECT 
        timestamp, uptime, score, xan_score as "xanScore",
        storage_committed as "storageCommitted", 
        storage_used as "storageUsed",
        storage_usage_percent as "storageUsagePercent",
        ram_total as "ramTotal", ram_used as "ramUsed", 
        ram_percent as "ramPercent", cpu_percent as "cpuPercent"
      FROM ${sql(table)}
      WHERE pubkey = ${pubkey}
        AND timestamp >= ${start}
        AND timestamp <= ${end}
      ORDER BY timestamp DESC
      ${limit ? sql`LIMIT ${limit}` : sql``}
    `

    return results as unknown as NodeMetrics[]
  }

  // Get pod credits history
  static async getPodCreditsHistory(
    network: Network,
    podId: string,
    startTime?: number,
    endTime?: number,
    limit?: number
  ): Promise<PodCredits[]> {
    const table = network === 'mainnet' ? 'mainnet_pod_credits' : 'devnet_pod_credits'
    const end = endTime || Date.now()
    const start = startTime || 0

    const results = await sql`
      SELECT timestamp, credits, pod_id as "podId"
      FROM ${sql(table)}
      WHERE pod_id = ${podId}
        AND timestamp >= ${start}
        AND timestamp <= ${end}
      ORDER BY timestamp DESC
      ${limit ? sql`LIMIT ${limit}` : sql``}
    `

    return results as unknown as PodCredits[]
  }

  // Get latest node metrics
  static async getLatestNodeMetrics(
    network: Network,
    pubkey: string
  ): Promise<NodeMetrics | null> {
    const table = network === 'mainnet' ? 'mainnet_node_metrics' : 'devnet_node_metrics'

    const results = await sql`
      SELECT 
        timestamp, uptime, score, xan_score as "xanScore",
        storage_committed as "storageCommitted", 
        storage_used as "storageUsed",
        storage_usage_percent as "storageUsagePercent",
        ram_total as "ramTotal", ram_used as "ramUsed", 
        ram_percent as "ramPercent", cpu_percent as "cpuPercent"
      FROM ${sql(table)}
      WHERE pubkey = ${pubkey}
      ORDER BY timestamp DESC
      LIMIT 1
    `

    return results.length > 0 ? (results[0] as NodeMetrics) : null
  }

  // Get latest pod credits
  static async getLatestPodCredits(
    network: Network,
    podId: string
  ): Promise<PodCredits | null> {
    const table = network === 'mainnet' ? 'mainnet_pod_credits' : 'devnet_pod_credits'

    const results = await sql`
      SELECT timestamp, credits, pod_id as "podId"
      FROM ${sql(table)}
      WHERE pod_id = ${podId}
      ORDER BY timestamp DESC
      LIMIT 1
    `

    return results.length > 0 ? (results[0] as PodCredits) : null
  }

  // Get credits change over time period
  static async getPodCreditsChange(
    network: Network,
    podId: string,
    minutes: number = 10
  ): Promise<{ current: number; previous: number; change: number; percentChange: number } | null> {
    const now = Date.now()
    const startTime = now - (minutes * 60 * 1000)

    const history = await this.getPodCreditsHistory(network, podId, startTime, now)
    
    if (history.length === 0) return null

    const current = history[0].credits
    const previous = history[history.length - 1].credits
    const change = current - previous
    const percentChange = previous > 0 ? ((change / previous) * 100) : 0

    return { current, previous, change, percentChange }
  }

  // Batch store node metrics
  static async batchStoreNodeMetrics(
    network: Network,
    nodes: Array<{ pubkey: string; metrics: Omit<NodeMetrics, 'timestamp'> }>
  ): Promise<void> {
    if (nodes.length === 0) return
    
    const timestamp = Date.now()
    const table = network === 'mainnet' ? 'mainnet_node_metrics' : 'devnet_node_metrics'

    // 1. Prepare the rows as an array of objects matching your DB columns
    const rows = nodes.map(({ pubkey, metrics }) => ({
      pubkey: pubkey,
      timestamp: timestamp,
      uptime: metrics.uptime,
      score: metrics.score,
      xan_score: metrics.xanScore ?? null,
      storage_committed: metrics.storageCommitted ?? null,
      storage_used: metrics.storageUsed ?? null,
      storage_usage_percent: metrics.storageUsagePercent ?? null,
      ram_total: metrics.ramTotal ?? null,
      ram_used: metrics.ramUsed ?? null,
      ram_percent: metrics.ramPercent ?? null,
      cpu_percent: metrics.cpuPercent ?? null,
    }))

    // 2. Use the correct postgres.js bulk insert syntax: 
    // sql`INSERT INTO ${sql(tableName)} ${sql(dataArray)}`
    await sql`
      INSERT INTO ${sql(table)} ${sql(rows)}
    `
  }

 static async batchStorePodCredits(
    network: Network,
    pods: Array<{ podId: string; credits: number }>
  ): Promise<void> {
    if (pods.length === 0) return
    
    const timestamp = Date.now()
    const table = network === 'mainnet' ? 'mainnet_pod_credits' : 'devnet_pod_credits'

    const rows = pods.map(({ podId, credits }) => ({
      pod_id: podId,
      timestamp: timestamp,
      credits: credits,
    }))

    await sql`
      INSERT INTO ${sql(table)} ${sql(rows)}
    `
  }
  // Get all tracked nodes
  static async getAllTrackedNodes(network: Network): Promise<string[]> {
    const table = network === 'mainnet' ? 'mainnet_node_metrics' : 'devnet_node_metrics'

    const results = await sql`
      SELECT DISTINCT pubkey
      FROM ${sql(table)}
      ORDER BY pubkey
    `

    return results.map((r: any) => r.pubkey)
  }

  // Get all tracked pods
  static async getAllTrackedPods(network: Network): Promise<string[]> {
    const table = network === 'mainnet' ? 'mainnet_pod_credits' : 'devnet_pod_credits'

    const results = await sql`
      SELECT DISTINCT pod_id
      FROM ${sql(table)}
      ORDER BY pod_id
    `

    return results.map((r: any) => r.pod_id)
  }

  // Get metrics for time range (for charts)
  static async getMetricsForTimeRange(
    network: Network,
    pubkey: string,
    timeRange: '5min' | '1hour' | '24hours' | '7days' | '30days'
  ): Promise<NodeMetrics[]> {
    const now = Date.now()
    const ranges = {
      '5min': 5 * 60 * 1000,
      '1hour': 60 * 60 * 1000,
      '24hours': 24 * 60 * 60 * 1000,
      '7days': 7 * 24 * 60 * 60 * 1000,
      '30days': 30 * 24 * 60 * 60 * 1000,
    }

    const startTime = now - ranges[timeRange]
    return this.getNodeHistory(network, pubkey, startTime, now)
  }

  // Get aggregated stats for a node over time
  static async getNodeAggregatedStats(
    network: Network,
    pubkey: string,
    startTime?: number,
    endTime?: number
  ): Promise<{
    avgUptime: number
    avgScore: number
    avgCpu: number
    avgRam: number
    maxStorage: number
    dataPoints: number
  } | null> {
    const table = network === 'mainnet' ? 'mainnet_node_metrics' : 'devnet_node_metrics'
    const end = endTime || Date.now()
    const start = startTime || (end - 24 * 60 * 60 * 1000) // default 24h

    const results = await sql`
      SELECT 
        AVG(uptime) as avg_uptime,
        AVG(score) as avg_score,
        AVG(cpu_percent) as avg_cpu,
        AVG(ram_percent) as avg_ram,
        MAX(storage_committed) as max_storage,
        COUNT(*) as data_points
      FROM ${sql(table)}
      WHERE pubkey = ${pubkey}
        AND timestamp >= ${start}
        AND timestamp <= ${end}
    `

    if (results.length === 0 || results[0].data_points === 0) return null

    return {
      avgUptime: parseFloat(results[0].avg_uptime) || 0,
      avgScore: parseFloat(results[0].avg_score) || 0,
      avgCpu: parseFloat(results[0].avg_cpu) || 0,
      avgRam: parseFloat(results[0].avg_ram) || 0,
      maxStorage: parseInt(results[0].max_storage) || 0,
      dataPoints: parseInt(results[0].data_points) || 0,
    }
  }
}
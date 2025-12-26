// app/api/analytics/collect/route.ts
import { NextResponse } from 'next/server'
import { RedisAnalyticsService } from '@/app/lib/redis-analytics'

interface PNodeListResponse {
  success: boolean
  data: Array<{
    id: string
    pubkey: string
    version: string
    responseTime: number
    status: string
    uptime: number
    lastSeen: number
    rpcPort: number
    ipAddress: string
    isPublic: boolean
    storageCommitted: number
    storageUsed: number
    storageUsagePercent: number
    scoreBreakdown: {
      total: number
      uptime: number
      responseTime: number
      storage: number
      version: number
      reliability: number
      grade: string
      color: string
    }
    score: number
  }>
}

interface PNodeDetailResponse {
  success: boolean
  data: {
    pubkey: string
    uptime: number
    score: number
    storageCommitted: number
    storageUsed: number
    storageUsagePercent: number
    isPublic: boolean
    details?: {
      result?: {
        cpu_percent?: number
        ram_total?: number
        ram_used?: number
      }
    }
  }
}

interface XanScoreResponse {
  xanScore: {
    score: number
    pubkey: string
  }
}

interface PodCreditsResponse {
  pods_credits: Array<{
    credits: number
    pod_id: string
  }>
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET_TOKEN

    // Verify cron job authorization
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Step 1: Fetch all nodes
    const nodesResponse = await fetch(`${BASE_URL}/api/pnodes`)
    const nodesData: PNodeListResponse = await nodesResponse.json()

    if (!nodesData.success || !nodesData.data) {
      throw new Error('Failed to fetch nodes list')
    }

    const nodes = nodesData.data
    const nodeMetricsToStore = []

    // Step 2: Fetch details for each node
    for (const node of nodes) {
      try {
        // Fetch node details
        const detailResponse = await fetch(
          `${BASE_URL}/api/pnodes/${node.pubkey}`
        )
        const detailData: PNodeDetailResponse = await detailResponse.json()

        // Fetch xanScore
        let xanScore: number | undefined
        try {
          const xanResponse = await fetch(
            `${BASE_URL}/api/xandscore/${node.pubkey}`
          )
          const xanData: XanScoreResponse = await xanResponse.json()
          xanScore = xanData.xanScore?.score
        } catch (error) {
          console.error(`Failed to fetch xanScore for ${node.pubkey}:`, error)
        }

        // Extract metrics based on node type (public/private)
        const metrics: any = {
          uptime: detailData.data.uptime,
          score: detailData.data.score,
          xanScore
        }

        // Add public node metrics
        if (detailData.data.isPublic && detailData.data.details?.result) {
          const result = detailData.data.details.result
          
          if (result.cpu_percent !== undefined) {
            metrics.cpuPercent = result.cpu_percent
          }
          
          if (result.ram_total !== undefined && result.ram_used !== undefined) {
            metrics.ramTotal = result.ram_total
            metrics.ramUsed = result.ram_used
            metrics.ramPercent = (result.ram_used / result.ram_total) * 100
          }
        }

        // Add storage metrics (available for both public and private)
        if (detailData.data.storageCommitted !== undefined) {
          metrics.storageCommitted = detailData.data.storageCommitted
          metrics.storageUsed = detailData.data.storageUsed
          metrics.storageUsagePercent = detailData.data.storageUsagePercent
        }

        nodeMetricsToStore.push({
          pubkey: node.pubkey,
          metrics
        })
      } catch (error) {
        console.error(`Failed to process node ${node.pubkey}:`, error)
        // Continue with other nodes
      }
    }

    // Step 3: Fetch pod credits
    const podsToStore = []
    try {
      const creditsResponse = await fetch(`${BASE_URL}/api/pods-credits`)
      const creditsData: PodCreditsResponse = await creditsResponse.json()

      if (creditsData.pods_credits) {
        for (const pod of creditsData.pods_credits) {
          podsToStore.push({
            podId: pod.pod_id,
            credits: pod.credits
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch pod credits:', error)
    }

    // Step 4: Batch store all data in Redis
    await Promise.all([
      RedisAnalyticsService.batchStoreNodeMetrics(nodeMetricsToStore),
      podsToStore.length > 0
        ? RedisAnalyticsService.batchStorePodCredits(podsToStore)
        : Promise.resolve()
    ])

    return NextResponse.json({
      success: true,
      message: 'Analytics data collected successfully',
      stats: {
        nodesProcessed: nodeMetricsToStore.length,
        podsProcessed: podsToStore.length,
        timestamp: Date.now()
      }
    })
  } catch (error) {
    console.error('Analytics collection error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to collect analytics data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
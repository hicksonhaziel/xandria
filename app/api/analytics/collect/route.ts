import { NextResponse } from 'next/server'
import { DBAnalyticsService } from '@/app/lib/db-analytics'

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
  xandscore: {
    score: number
    pubkey: string
  }
}

interface PodCreditsResponse {
  pods_credits: Array<{
    credits: number
    pod_id: string
  }>
  network?: string
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET_TOKEN

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Process both networks in parallel
    const [devnetStats, mainnetStats] = await Promise.all([
      processNetwork('devnet'),
      processNetwork('mainnet')
    ])

    return NextResponse.json({
      success: true,
      message: 'Analytics data collected successfully',
      stats: {
        devnet: devnetStats,
        mainnet: mainnetStats,
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

async function processNetwork(network: 'devnet' | 'mainnet') {
  try {
    // Step 1: Fetch all nodes (filtered by network)
    const nodesResponse = await fetch(`${BASE_URL}/api/pnodes?network=${network}`)
    const nodesData: PNodeListResponse = await nodesResponse.json()

    if (!nodesData.success || !nodesData.data) {
      throw new Error(`Failed to fetch ${network} nodes list`)
    }

    const nodes = nodesData.data
    const nodeMetricsToStore = []

    // Step 2: Fetch details for each node
    for (const node of nodes) {
      try {
        const detailResponse = await fetch(
          `${BASE_URL}/api/pnodes/${node.pubkey}?network=${network}`
        )
        const detailData: PNodeDetailResponse = await detailResponse.json()

        // Fetch xanScore
        let xanScore: number | undefined
        try {
          let xanResponse = await fetch(
            `${BASE_URL}/api/xandscore/${node.pubkey}`
          )
          
          if (!xanResponse.ok) {
            xanResponse = await fetch(
              `${BASE_URL}/api/xanScore/${node.pubkey}`
            )
          }
          
          if (xanResponse.ok) {
            const xanData: XanScoreResponse = await xanResponse.json()
            xanScore = xanData.xandscore?.score
          }
        } catch (error) {
          console.log(`XanScore fetch failed for ${node.pubkey}`)
        }

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

        // Add storage metrics
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
        console.error(`Failed to process ${network} node ${node.pubkey}:`, error)
      }
    }

    // Step 3: Fetch pod credits for this network
    const podsToStore = []
    try {
      const creditsResponse = await fetch(`${BASE_URL}/api/pods-credits?network=${network}`)
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
      console.error(`Failed to fetch ${network} pod credits:`, error)
    }

    // Step 4: Store in database
    await Promise.all([
      DBAnalyticsService.batchStoreNodeMetrics(network, nodeMetricsToStore),
      podsToStore.length > 0
        ? DBAnalyticsService.batchStorePodCredits(network, podsToStore)
        : Promise.resolve()
    ])

    return {
      nodesProcessed: nodeMetricsToStore.length,
      podsProcessed: podsToStore.length
    }
  } catch (error) {
    console.error(`Failed to process ${network}:`, error)
    return {
      nodesProcessed: 0,
      podsProcessed: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
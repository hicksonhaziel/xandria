import { NextResponse } from 'next/server'
import { DBAnalyticsService } from '@/app/lib/db-analytics'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const network = (searchParams.get('network') || 'devnet') as 'devnet' | 'mainnet'
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get all tracked entities for this network
    const [nodesPubkeys, podIds] = await Promise.all([
      DBAnalyticsService.getAllTrackedNodes(network),
      DBAnalyticsService.getAllTrackedPods(network)
    ])

    // Get latest metrics for top nodes
    const nodesData = await Promise.all(
      nodesPubkeys.slice(0, limit).map(async (pubkey) => {
        const latest = await DBAnalyticsService.getLatestNodeMetrics(network, pubkey)
        return { pubkey, latest }
      })
    )

    // Get latest credits for top pods
    const podsData = await Promise.all(
      podIds.slice(0, limit).map(async (podId) => {
        const latest = await DBAnalyticsService.getLatestPodCredits(network, podId)
        const change10min = await DBAnalyticsService.getPodCreditsChange(network, podId, 10)
        const change7days = await DBAnalyticsService.getPodCreditsChange(network, podId, 7 * 24 * 60)
        return { podId, latest, change10min, change7days }
      })
    )

    return NextResponse.json({
      success: true,
      data: {
        network,
        nodes: {
          total: nodesPubkeys.length,
          tracked: nodesData.filter(n => n.latest !== null).length,
          data: nodesData
        },
        pods: {
          total: podIds.length,
          tracked: podsData.filter(p => p.latest !== null).length,
          data: podsData
        },
        timestamp: Date.now()
      }
    })
  } catch (error) {
    console.error('Failed to fetch analytics overview:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch analytics overview',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
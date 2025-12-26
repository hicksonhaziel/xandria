// app/api/analytics/overview/route.ts
import { NextResponse } from 'next/server'
import { RedisAnalyticsService } from '@/app/lib/redis-analytics'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get all tracked entities
    const [nodesPubkeys, podIds] = await Promise.all([
      RedisAnalyticsService.getAllTrackedNodes(),
      RedisAnalyticsService.getAllTrackedPods()
    ])

    // Get latest metrics for top nodes
    const nodesData = await Promise.all(
      nodesPubkeys.slice(0, limit).map(async (pubkey) => {
        const latest = await RedisAnalyticsService.getLatestNodeMetrics(pubkey)
        return { pubkey, latest }
      })
    )

    // Get latest credits for top pods
    const podsData = await Promise.all(
      podIds.slice(0, limit).map(async (podId) => {
        const latest = await RedisAnalyticsService.getLatestPodCredits(podId)
        const change10min = await RedisAnalyticsService.getPodCreditsChange(podId, '10min')
        const change7days = await RedisAnalyticsService.getPodCreditsChange(podId, '7days')
        return { podId, latest, change10min, change7days }
      })
    )

    return NextResponse.json({
      success: true,
      data: {
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
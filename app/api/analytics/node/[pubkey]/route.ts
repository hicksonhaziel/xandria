// app/api/analytics/node/[pubkey]/route.ts
import { NextResponse } from 'next/server'
import { RedisAnalyticsService } from '@/app/lib/redis-analytics'

export async function GET(
  request: Request,
  { params }: { params: { pubkey: string } }
) {
  try {
    const { pubkey } = params
    const { searchParams } = new URL(request.url)
    
    // Optional time range parameters
    const startTime = searchParams.get('startTime')
      ? parseInt(searchParams.get('startTime')!)
      : undefined
    const endTime = searchParams.get('endTime')
      ? parseInt(searchParams.get('endTime')!)
      : undefined
    const period = searchParams.get('period') as '1h' | '24h' | '7d' | 'all' | null

    // Calculate time range based on period
    let start = startTime
    let end = endTime || Date.now()

    if (period && !startTime) {
      const now = Date.now()
      switch (period) {
        case '1h':
          start = now - (60 * 60 * 1000)
          break
        case '24h':
          start = now - (24 * 60 * 60 * 1000)
          break
        case '7d':
          start = now - (7 * 24 * 60 * 60 * 1000)
          break
        case 'all':
          start = 0
          break
        default:
          start = now - (24 * 60 * 60 * 1000) // Default to 24h
      }
    }

    // Fetch historical data
    const history = await RedisAnalyticsService.getNodeHistory(
      pubkey,
      start,
      end
    )

    if (history.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          pubkey,
          history: [],
          stats: {
            dataPoints: 0,
            timeRange: { start: start || 0, end }
          }
        },
        message: 'No historical data available for this node'
      })
    }

    // Calculate summary statistics
    const uptimes = history.map(h => h.uptime).filter(u => u !== undefined)
    const scores = history.map(h => h.score).filter(s => s !== undefined)
    const xanScores = history.map(h => h.xanScore).filter(x => x !== undefined)
    const cpuPercents = history.map(h => h.cpuPercent).filter(c => c !== undefined)
    const ramPercents = history.map(h => h.ramPercent).filter(r => r !== undefined)
    const storagePercents = history.map(h => h.storageUsagePercent).filter(s => s !== undefined)

    const calculateStats = (values: number[]) => {
      if (values.length === 0) return null
      return {
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        current: values[values.length - 1],
        previous: values[0],
        change: values[values.length - 1] - values[0]
      }
    }

    const stats = {
      uptime: calculateStats(uptimes),
      score: calculateStats(scores),
      xanScore: calculateStats(xanScores),
      cpuPercent: calculateStats(cpuPercents),
      ramPercent: calculateStats(ramPercents),
      storagePercent: calculateStats(storagePercents)
    }

    return NextResponse.json({
      success: true,
      data: {
        pubkey,
        history,
        stats: {
          dataPoints: history.length,
          timeRange: {
            start: history[0].timestamp,
            end: history[history.length - 1].timestamp
          },
          metrics: stats
        }
      }
    })
  } catch (error) {
    console.error('Failed to fetch node history:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch node history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
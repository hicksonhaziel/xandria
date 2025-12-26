// app/api/analytics/pod/[podId]/route.ts
import { NextResponse } from 'next/server'
import { RedisAnalyticsService } from '@/app/lib/redis-analytics'

export async function GET(
  request: Request,
  { params }: { params: { podId: string } }
) {
  try {
    const { podId } = params
    const { searchParams } = new URL(request.url)
    
    // Optional time range parameters
    const startTime = searchParams.get('startTime')
      ? parseInt(searchParams.get('startTime')!)
      : undefined
    const endTime = searchParams.get('endTime')
      ? parseInt(searchParams.get('endTime')!)
      : undefined
    const period = searchParams.get('period') as '10min' | '1h' | '24h' | '7d' | 'all' | null

    // Calculate time range based on period
    let start = startTime
    let end = endTime || Date.now()

    if (period && !startTime) {
      const now = Date.now()
      switch (period) {
        case '10min':
          start = now - (10 * 60 * 1000)
          break
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
    const history = await RedisAnalyticsService.getPodCreditsHistory(
      podId,
      start,
      end
    )

    if (history.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          podId,
          history: [],
          stats: {
            dataPoints: 0,
            timeRange: { start: start || 0, end }
          }
        },
        message: 'No historical data available for this pod'
      })
    }

    // Calculate credits change for different periods
    const [change10min, change7days] = await Promise.all([
      RedisAnalyticsService.getPodCreditsChange(podId, '10min'),
      RedisAnalyticsService.getPodCreditsChange(podId, '7days')
    ])

    // Calculate overall statistics
    const credits = history.map(h => h.credits)
    const currentCredits = credits[credits.length - 1]
    const previousCredits = credits[0]
    const totalChange = currentCredits - previousCredits
    const percentChange = previousCredits > 0 
      ? ((totalChange / previousCredits) * 100) 
      : 0

    // Calculate earning rate (credits per hour)
    const timeRangeHours = (history[history.length - 1].timestamp - history[0].timestamp) / (1000 * 60 * 60)
    const earningRate = timeRangeHours > 0 ? totalChange / timeRangeHours : 0

    return NextResponse.json({
      success: true,
      data: {
        podId,
        history,
        stats: {
          dataPoints: history.length,
          timeRange: {
            start: history[0].timestamp,
            end: history[history.length - 1].timestamp
          },
          credits: {
            current: currentCredits,
            previous: previousCredits,
            change: totalChange,
            percentChange: parseFloat(percentChange.toFixed(2)),
            min: Math.min(...credits),
            max: Math.max(...credits),
            avg: credits.reduce((a, b) => a + b, 0) / credits.length,
            earningRate: parseFloat(earningRate.toFixed(2))
          },
          changes: {
            last10min: change10min,
            last7days: change7days
          }
        }
      }
    })
  } catch (error) {
    console.error('Failed to fetch pod credits history:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch pod credits history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
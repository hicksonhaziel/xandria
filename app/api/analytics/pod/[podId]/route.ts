import { NextResponse } from 'next/server'
import { DBAnalyticsService } from '@/app/lib/db-analytics'

export async function GET(
  request: Request,
  context: { params: Promise<{ podId: string }> }
) {
  try {
    const { podId } = await context.params
    const { searchParams } = new URL(request.url)
    
    const network = (searchParams.get('network') || 'devnet') as 'devnet' | 'mainnet'
    const startTime = searchParams.get('startTime')
      ? parseInt(searchParams.get('startTime')!)
      : undefined
    const endTime = searchParams.get('endTime')
      ? parseInt(searchParams.get('endTime')!)
      : undefined
    const period = searchParams.get('period') as '10min' | '1h' | '24h' | '7d' | 'all' | null

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
          start = now - (24 * 60 * 60 * 1000)
      }
    }

    const history = await DBAnalyticsService.getPodCreditsHistory(
      network,
      podId,
      start,
      end
    )

    if (history.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          podId,
          network,
          history: [],
          stats: {
            dataPoints: 0,
            timeRange: { start: start || 0, end }
          }
        },
        message: 'No historical data available for this pod'
      })
    }

    const [change10min, change7days] = await Promise.all([
      DBAnalyticsService.getPodCreditsChange(network, podId, 10),
      DBAnalyticsService.getPodCreditsChange(network, podId, 7 * 24 * 60)
    ])

    const credits = history.map(h => h.credits)
    const currentCredits = credits[0] // Most recent (DESC order)
    const previousCredits = credits[credits.length - 1]
    const totalChange = currentCredits - previousCredits
    const percentChange = previousCredits > 0 
      ? ((totalChange / previousCredits) * 100) 
      : 0

    const timeRangeHours = (history[0].timestamp - history[history.length - 1].timestamp) / (1000 * 60 * 60)
    const earningRate = timeRangeHours > 0 ? totalChange / timeRangeHours : 0

    return NextResponse.json({
      success: true,
      data: {
        podId,
        network,
        history,
        stats: {
          dataPoints: history.length,
          timeRange: {
            start: history[history.length - 1].timestamp,
            end: history[0].timestamp
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
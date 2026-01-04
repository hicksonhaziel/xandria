import { NextResponse } from 'next/server'
import { RedisAnalyticsService } from '@/app/lib/redis-analytics'

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

    await RedisAnalyticsService.initializeExpirations()

    return NextResponse.json({
      success: true,
      message: 'Expirations initialized'
    })
  } catch (error) {
    console.error('Init error:', error)
    return NextResponse.json(
      { success: false, error: 'Init failed' },
      { status: 500 }
    )
  }
}
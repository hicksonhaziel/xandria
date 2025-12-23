// app/api/leaderboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prpcClient } from '@/app/lib/prpc';
import { calculateXandScore } from '@/app/lib/scoring';
import { RedisService } from '@/app/lib/redis-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');
    const useCache = searchParams.get('cache') !== 'false';

    // Try cache
    if (useCache) {
      const cached = await RedisService.getLeaderboard();
      if (cached && Array.isArray(cached)) {
        return NextResponse.json({
          success: true,
          data: cached.slice(0, limit),
          total: cached.length,
          cached: true,
          timestamp: Date.now(),
        });
      }
    }

    // Fetch fresh data
    const pnodes = await prpcClient.getClusterNodes();
    
    if (!pnodes || pnodes.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        cached: false,
        timestamp: Date.now(),
      });
    }
    
    const networkAvg = {
      uptime: pnodes.reduce((sum, n) => sum + n.uptime, 0) / pnodes.length,
      storage: pnodes.reduce((sum, n) => sum + n.storageCommitted, 0) / pnodes.length,
      activeNodeCount: pnodes.filter(n => n.status === 'active').length,
    };

    const leaderboard = pnodes
      .map(pnode => {
        const breakdown = calculateXandScore(pnode, networkAvg);
        return {
          pubkey: pnode.pubkey,
          score: breakdown.total,
          uptime: pnode.uptime,
          storage: pnode.storageCommitted,
          status: pnode.status,
          version: pnode.version,
          rank: 0,
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((node, index) => ({
        ...node,
        rank: index + 1,
      }));

    // Cache leaderboard in background
    RedisService.cacheLeaderboard(leaderboard).catch(err => 
      console.error('Failed to cache leaderboard:', err)
    );

    return NextResponse.json({
      success: true,
      data: leaderboard.slice(0, limit),
      total: leaderboard.length,
      cached: false,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error generating leaderboard:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate leaderboard',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
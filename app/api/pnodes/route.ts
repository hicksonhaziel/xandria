// app/api/pnodes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prpcClient } from '@/app/lib/prpc';
import { calculateXandScore } from '@/app/lib/scoring';
import { RedisService } from '@/app/lib/redis-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const minScore = searchParams.get('minScore');
    const useCache = searchParams.get('cache') !== 'false';

    // Try cache first
    if (useCache) {
      const cached = await RedisService.getAllNodes();
      const stats = await RedisService.getNetworkStats();
      
      if (cached && Array.isArray(cached)) {
        let filtered = cached;
        
        if (status && status !== 'all') {
          filtered = filtered.filter((n: any) => n.status === status);
        }
        if (minScore) {
          filtered = filtered.filter((n: any) => n.score >= parseFloat(minScore));
        }

        return NextResponse.json({
          success: true,
          data: filtered,
          count: filtered.length,
          stats: stats || {},
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
        count: 0,
        stats: {
          total: 0,
          active: 0,
          syncing: 0,
          offline: 0,
          avgScore: 0,
          totalStorage: 0,
          usedStorage: 0,
        },
        cached: false,
        timestamp: Date.now(),
      });
    }

    const networkAvg = {
      uptime: pnodes.reduce((sum, n) => sum + n.uptime, 0) / pnodes.length,
      storage: pnodes.reduce((sum, n) => sum + n.storageCommitted, 0) / pnodes.length,
      activeNodeCount: pnodes.filter(n => n.status === 'active').length,
    };

    const pnodesWithScores = pnodes.map(pnode => {
      const breakdown = calculateXandScore(pnode, networkAvg);
      return {
        ...pnode,
        scoreBreakdown: breakdown,
        score: breakdown.total,
      };
    });

    // Apply filters
    let filtered = pnodesWithScores;
    if (status && status !== 'all') {
      filtered = filtered.filter(n => n.status === status);
    }
    if (minScore) {
      filtered = filtered.filter(n => n.score >= parseFloat(minScore));
    }

    const stats = {
      total: pnodesWithScores.length,
      active: pnodesWithScores.filter(n => n.status === 'active').length,
      syncing: pnodesWithScores.filter(n => n.status === 'syncing').length,
      offline: pnodesWithScores.filter(n => n.status === 'offline').length,
      avgScore: pnodesWithScores.reduce((sum, n) => sum + n.score, 0) / pnodesWithScores.length,
      totalStorage: pnodesWithScores.reduce((sum, n) => sum + n.storageCommitted, 0),
      usedStorage: pnodesWithScores.reduce((sum, n) => sum + n.storageUsed, 0),
    };

    // Cache results in background (don't await)
    Promise.all([
      RedisService.cacheAllNodes(pnodesWithScores),
      RedisService.cacheNetworkStats(stats),
      RedisService.setLastUpdate()
    ]).catch(err => console.error('Failed to cache data:', err));

    return NextResponse.json({
      success: true,
      data: filtered,
      count: filtered.length,
      stats,
      cached: false,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching pNodes:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch pNodes',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
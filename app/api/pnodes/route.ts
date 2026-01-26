import { NextRequest, NextResponse } from 'next/server';
import { devnetClient, mainnetClient, getClientForNetwork, type NetworkType } from '@/app/lib/prpc';
import { calculateXandScore } from '@/app/lib/scoring';
import { RedisService } from '@/app/lib/redis-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const minScore = searchParams.get('minScore');
    const useCache = searchParams.get('cache') !== 'false';
    const network = (searchParams.get('network') || 'devnet') as NetworkType;

    // Validate network parameter
    if (network !== 'devnet' && network !== 'mainnet') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid network parameter',
          message: 'Network must be either "devnet" or "mainnet"',
        },
        { status: 400 }
      );
    }

    // Try cache with network-specific key
    if (useCache) {
      const cached = await RedisService.getAllNodes(network);
      const stats = await RedisService.getNetworkStats(network);
      
      if (cached && Array.isArray(cached)) {
        let filtered = cached;
        
        // Apply status filter
        if (status && status !== 'all') {
          filtered = filtered.filter((n: any) => n.status === status);
        }
        
        // Apply score filter
        if (minScore) {
          filtered = filtered.filter((n: any) => n.score >= parseFloat(minScore));
        }
        
        return NextResponse.json({
          success: true,
          data: filtered,
          count: filtered.length,
          stats: stats || {},
          cached: true,
          network,
          timestamp: Date.now(),
        });
      }
    }

    // Fetch fresh data from the appropriate network client
    const client = getClientForNetwork(network);
    const pnodes = await client.getClusterNodes(`cluster-${network}`);
    
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
        network,
        timestamp: Date.now(),
      });
    }

    // Calculate network averages for scoring
    const networkAvg = {
      uptime: pnodes.reduce((sum, n) => sum + n.uptime, 0) / (pnodes.length || 1),
      storage: pnodes.reduce((sum, n) => sum + n.storageCommitted, 0) / (pnodes.length || 1),
      activeNodeCount: pnodes.filter(n => n.status === 'active').length,
    };

    // Calculate scores for all nodes
    const pnodesWithScores = pnodes.map(pnode => {
      const breakdown = calculateXandScore(pnode, networkAvg);
      return {
        ...pnode,
        scoreBreakdown: breakdown,
        score: breakdown.total,
      };
    });

    // Apply additional filters
    let filtered = pnodesWithScores;
    if (status && status !== 'all') {
      filtered = filtered.filter(n => n.status === status);
    }
    if (minScore) {
      filtered = filtered.filter(n => n.score >= parseFloat(minScore));
    }

    // Calculate network statistics
    const stats = {
      total: pnodesWithScores.length,
      active: pnodesWithScores.filter(n => n.status === 'active').length,
      syncing: pnodesWithScores.filter(n => n.status === 'syncing').length,
      offline: pnodesWithScores.filter(n => n.status === 'offline').length,
      avgScore: pnodesWithScores.reduce((sum, n) => sum + n.score, 0) / (pnodesWithScores.length || 1),
      totalStorage: pnodesWithScores.reduce((sum, n) => sum + n.storageCommitted, 0),
      usedStorage: pnodesWithScores.reduce((sum, n) => sum + n.storageUsed, 0),
    };

    // Cache results in background with network-specific keys
    Promise.all([
      RedisService.cacheAllNodes(pnodesWithScores, network),
      RedisService.cacheNetworkStats(stats, network),
      RedisService.setLastUpdate(network)
    ]).catch(err => console.error(`Failed to cache ${network} data:`, err));

    return NextResponse.json({
      success: true,
      data: filtered,
      count: filtered.length,
      stats,
      cached: false,
      network,
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
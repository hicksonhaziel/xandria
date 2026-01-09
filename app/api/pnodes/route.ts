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
    const network = searchParams.get('network') || 'devnet'; 

    // Try cache with network-specific key
    if (useCache) {
      const cached = await RedisService.getAllNodes();
      const stats = await RedisService.getNetworkStats();
      
      if (cached && Array.isArray(cached)) {
        let filtered = cached;
        
        // Filter by network first
        if (network === 'mainnet') {
          // Fetch mainnet credits to identify mainnet nodes
          const mainnetPubkeys = await fetchMainnetPubkeys();
          filtered = filtered.filter((n: any) => mainnetPubkeys.has(n.pubkey));
        } else {
          // Devnet: exclude mainnet nodes
          const mainnetPubkeys = await fetchMainnetPubkeys();
          filtered = filtered.filter((n: any) => !mainnetPubkeys.has(n.pubkey));
        }
        
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
          network,
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
        network,
        timestamp: Date.now(),
      });
    }

    // Fetch mainnet node pubkeys
    const mainnetPubkeys = await fetchMainnetPubkeys();

    // Filter by network
    let networkFilteredNodes = pnodes;
    if (network === 'mainnet') {
      networkFilteredNodes = pnodes.filter(n => mainnetPubkeys.has(n.pubkey));
    } else {
      networkFilteredNodes = pnodes.filter(n => !mainnetPubkeys.has(n.pubkey));
    }

    // Calculate network averages based on filtered nodes
    const networkAvg = {
      uptime: networkFilteredNodes.reduce((sum, n) => sum + n.uptime, 0) / (networkFilteredNodes.length || 1),
      storage: networkFilteredNodes.reduce((sum, n) => sum + n.storageCommitted, 0) / (networkFilteredNodes.length || 1),
      activeNodeCount: networkFilteredNodes.filter(n => n.status === 'active').length,
    };

    const pnodesWithScores = networkFilteredNodes.map(pnode => {
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

    const stats = {
      total: pnodesWithScores.length,
      active: pnodesWithScores.filter(n => n.status === 'active').length,
      syncing: pnodesWithScores.filter(n => n.status === 'syncing').length,
      offline: pnodesWithScores.filter(n => n.status === 'offline').length,
      avgScore: pnodesWithScores.reduce((sum, n) => sum + n.score, 0) / (pnodesWithScores.length || 1),
      totalStorage: pnodesWithScores.reduce((sum, n) => sum + n.storageCommitted, 0),
      usedStorage: pnodesWithScores.reduce((sum, n) => sum + n.storageUsed, 0),
    };

    // Cache results in background (cache all nodes, filter on retrieval)
    Promise.all([
      RedisService.cacheAllNodes(pnodes.map(pnode => {
        const breakdown = calculateXandScore(pnode, networkAvg);
        return {
          ...pnode,
          scoreBreakdown: breakdown,
          score: breakdown.total,
        };
      })),
      RedisService.cacheNetworkStats(stats),
      RedisService.setLastUpdate()
    ]).catch(err => console.error('Failed to cache data:', err));

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

// Helper function to fetch mainnet node pubkeys
async function fetchMainnetPubkeys(): Promise<Set<string>> {
  try {
    const endpoint = process.env.NEXT_PUBLIC_XANDEUM_MAINET_CREDIT_ENDPOINT;
    if (!endpoint) {
      console.warn('Mainnet credit endpoint not configured');
      return new Set();
    }

    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`Failed to fetch mainnet credits: ${response.statusText}`);
    }

    const data = await response.json();
    const pubkeys = new Set<string>();
    
    if (data.pods_credits && Array.isArray(data.pods_credits)) {
      data.pods_credits.forEach((pod: { pod_id: string }) => {
        if (pod.pod_id) {
          pubkeys.add(pod.pod_id);
        }
      });
    }

    return pubkeys;
  } catch (error) {
    console.error('Error fetching mainnet pubkeys:', error);
    return new Set();
  }
}
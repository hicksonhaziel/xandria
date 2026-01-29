import { NextRequest, NextResponse } from 'next/server';
import { getClientForNetwork, type NetworkType } from '@/app/lib/prpc';
import { calculateXandScore } from '@/app/lib/scoring';
import { RedisService } from '@/app/lib/redis-service';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ pubkey: string }> }
) {
  try {
    const { pubkey } = await context.params;

    // Get network parameter from query string
    const searchParams = request.nextUrl.searchParams;
    const network = (searchParams.get('network') || 'devnet') as NetworkType;

    // Validate network parameter
    if (network !== 'devnet' && network !== 'mainnet') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid network parameter',
          message: 'Network must be either "devnet" or "mainnet"'
        },
        { status: 400 }
      );
    }

    if (!pubkey || pubkey.length < 32) {
      return NextResponse.json(
        { success: false, error: 'Invalid pubkey format' },
        { status: 400 }
      );
    }

    const useCache = searchParams.get('cache') !== 'false';

    // Try cache with network-specific key
    if (useCache) {
      const cached = await RedisService.getNode(pubkey, network);
      if (cached) {
        return NextResponse.json({
          success: true,
          data: cached,
          cached: true,
          network,
          timestamp: Date.now(),
        });
      }
    }

    // Get network-specific client
    const client = getClientForNetwork(network);

    // Fetch pNode from the correct network
    const pnode = await client.getPNodeInfo(pubkey);
    if (!pnode) {
      return NextResponse.json(
        { success: false, error: 'pNode not found' },
        { status: 404 }
      );
    }

    // Fetch all nodes from the correct network
    const allNodes = await client.getClusterNodes(`cluster-${network}`);
    if (allNodes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Unable to fetch network data' },
        { status: 503 }
      );
    }

    const networkAvg = {
      uptime: allNodes.reduce((sum, n) => sum + n.uptime, 0) / allNodes.length,
      storage: allNodes.reduce((sum, n) => sum + n.storageCommitted, 0) / allNodes.length,
      activeNodeCount: allNodes.filter(n => n.status === 'active').length,
    };

    const scoreBreakdown = calculateXandScore(pnode, networkAvg);
    const uptimePercentile = calculatePercentile(pnode.uptime, allNodes.map(n => n.uptime));
    const storagePercentile = calculatePercentile(pnode.storageCommitted, allNodes.map(n => n.storageCommitted));

    const nodeData = {
      ...pnode,
      scoreBreakdown,
      score: scoreBreakdown.total,
      networkComparison: {
        uptimePercentile: Math.round(uptimePercentile),
        storagePercentile: Math.round(storagePercentile),
        networkAverage: networkAvg,
        totalNodes: allNodes.length,
      },
      recommendations: generateRecommendations(pnode, scoreBreakdown, networkAvg),
    };

    // Cache the result with network-specific key
    await RedisService.cacheNode(pubkey, nodeData, network);

    return NextResponse.json({
      success: true,
      data: nodeData,
      cached: false,
      network,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching pNode:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch pNode',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function calculatePercentile(value: number, dataset: number[]): number {
  if (dataset.length === 0) return 0;
  const sorted = [...dataset].sort((a, b) => a - b);
  const count = sorted.filter(v => v <= value).length;
  return (count / sorted.length) * 100;
}

function generateRecommendations(pnode: any, score: any, networkAvg: any) {
  type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
  
  interface Recommendation {
    category: string;
    severity: Severity;
    message: string;
    action: string;
  }
  
  const recommendations: Recommendation[] = [];

  if (pnode.status === 'offline') {
    recommendations.push({
      category: 'connectivity',
      severity: 'critical',
      message: 'Node is currently offline.',
      action: 'Check network connectivity and node service status immediately.',
    });
  }

  if (pnode.uptime < 90) {
    recommendations.push({
      category: 'uptime',
      severity: 'high',
      message: `Uptime is ${pnode.uptime.toFixed(1)}%, below recommended 95%+.`,
      action: 'Review system logs and ensure stable network connectivity.',
    });
  }

  if (pnode.storageUsagePercent > 90) {
    recommendations.push({
      category: 'storage',
      severity: 'high',
      message: `Storage usage is critically high at ${pnode.storageUsagePercent.toFixed(1)}%.`,
      action: 'Expand storage capacity or archive old data immediately.',
    });
  } else if (pnode.storageUsagePercent > 80) {
    recommendations.push({
      category: 'storage',
      severity: 'medium',
      message: `Storage usage is ${pnode.storageUsagePercent.toFixed(1)}%.`,
      action: 'Plan for storage expansion soon.',
    });
  }

  if (pnode.uptime < networkAvg.uptime - 5) {
    recommendations.push({
      category: 'performance',
      severity: 'medium',
      message: 'Node uptime is below network average.',
      action: 'Investigate potential reliability issues.',
    });
  }

  if (score.total >= 90) {
    recommendations.push({
      category: 'general',
      severity: 'info',
      message: `Excellent performance! XandScore: ${score.total.toFixed(1)}/100`,
      action: 'Maintain current configuration and monitoring.',
    });
  }

  const severityOrder: Record<Severity, number> = { 
    critical: 0, high: 1, medium: 2, low: 3, info: 4 
  };
  
  recommendations.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  return recommendations;
}
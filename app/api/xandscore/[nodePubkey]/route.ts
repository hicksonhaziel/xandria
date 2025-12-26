// app/api/xandscore/[nodePubkey]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prpcClient } from '@/app/lib/prpc';
import { calculateXandScore } from '@/app/lib/scoring';
import { RedisService } from '@/app/lib/redis-service';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ nodePubkey: string }> }
) {
  try {
    const { nodePubkey } = await context.params;

    if (!nodePubkey || nodePubkey.length < 32) {
      return NextResponse.json(
        { success: false, error: 'Invalid pubkey format' },
        { status: 400 }
      );
    }

    const useCache = request.nextUrl.searchParams.get('cache') !== 'false';

    // Try cache first (score-only cache)
    if (useCache) {
      const cachedScore = await RedisService.getNodeScore(nodePubkey);
      if (cachedScore !== null) {
        return NextResponse.json({
          xandscore: {
            score: cachedScore,
            pubkey: nodePubkey,
          },
        });
      }
    }

    // Fetch node data
    const pnode = await prpcClient.getPNodeInfo(nodePubkey);
    if (!pnode) {
      return NextResponse.json(
        { success: false, error: 'pNode not found' },
        { status: 404 }
      );
    }

    // Fetch all nodes for network averages
    const allNodes = await prpcClient.getClusterNodes();
    if (allNodes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Unable to fetch network data' },
        { status: 503 }
      );
    }

    // Calculate network averages
    const networkAvg = {
      uptime: allNodes.reduce((sum, n) => sum + n.uptime, 0) / allNodes.length,
      storage: allNodes.reduce((sum, n) => sum + n.storageCommitted, 0) / allNodes.length,
      activeNodeCount: allNodes.filter(n => n.status === 'active').length,
    };

    // Calculate XandScore
    const scoreBreakdown = calculateXandScore(pnode, networkAvg);
    const totalScore = Math.min(100, scoreBreakdown.total);

    // Cache the score
    await RedisService.cacheNodeScore(nodePubkey, totalScore);

    // Return only the score in the same format as your mock
    return NextResponse.json({
      xandscore: {
        score: totalScore,
        pubkey: nodePubkey,
      },
    });
  } catch (error) {
    console.error('Error calculating XandScore:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate XandScore',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
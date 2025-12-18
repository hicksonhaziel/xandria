import type { PNode } from '@/app/types';

/**
 * Score breakdown interface matching PNode.scoreBreakdown
 */
export interface ScoreBreakdown {
  total: number;
  uptime: number;
  responseTime: number;
  storage: number;
  version: number;
  reliability: number;
  grade: string;
  color: string;
}

/**
 * Network-wide statistics for relative scoring
 */
export interface NetworkAverage {
  uptime: number;
  storage: number;
  activeNodeCount: number;
}

/**
 * XandScore™ - Proprietary pNode scoring algorithm
 * 
 * Scoring Components (Total: 100 points):
 * - Uptime (30 pts): Based on cumulative uptime percentage
 * - Response Time (25 pts): Based on gossip freshness (lastSeen)
 * - Storage Capacity (20 pts): Relative to network average committed storage
 * - Version Currency (15 pts): Latest software version gets max points
 * - Reliability (10 pts): Status, storage usage, and uptime consistency
 * 
 * @param pnode The pNode to score
 * @param networkAvg Network-wide averages for relative comparison
 * @returns Complete score breakdown with grade and color
 */
export function calculateXandScore(
  pnode: PNode,
  networkAvg: NetworkAverage
): ScoreBreakdown {
  // 1. Uptime Score (30 points max)
  // Normalized to 100% uptime = 30 points
  const maxUptimeObserved = 300000; // ~3.5 days (reasonable max for scoring)
  const uptimeScore = Math.min(30, (pnode.uptime / maxUptimeObserved) * 30);

  // 2. Response Time Score (25 points max)
  // Based on gossip freshness - how recently the node was seen
  // Active nodes (<1 min) get full points, degrades linearly to 5 min
  const lastSeenAgeMs = Date.now() - pnode.lastSeen;
  const maxAgeForPoints = 300_000; // 5 minutes
  const responseScore = Math.max(
    0, 
    25 * (1 - lastSeenAgeMs / maxAgeForPoints)
  );

  // 3. Storage Capacity Score (20 points max)
  // Relative to network average committed storage
  // Prevents unfair advantage to massive storage providers
  const storageScore = networkAvg.storage > 0
    ? Math.min(20, (pnode.storageCommitted / networkAvg.storage) * 20)
    : 0;

  // 4. Version Currency Score (15 points max)
  // Latest versions get max points, older versions penalized
  const versionScore = getVersionScore(pnode.version);

  // 5. Network Reliability Score (10 points max)
  // Composite score based on status, storage health, and uptime consistency
  const reliabilityScore = calculateReliability(pnode, networkAvg);

  // Calculate total (capped at 100)
  const total = Math.min(
    100,
    uptimeScore + responseScore + storageScore + versionScore + reliabilityScore
  );

  // Determine letter grade and color
  const { grade, color } = getScoreGrade(total);

  // Return rounded scores (1 decimal place for precision)
  return {
    total: Math.round(total * 10) / 10,
    uptime: Math.round(uptimeScore * 10) / 10,
    responseTime: Math.round(responseScore * 10) / 10,
    storage: Math.round(storageScore * 10) / 10,
    version: Math.round(versionScore * 10) / 10,
    reliability: Math.round(reliabilityScore * 10) / 10,
    grade,
    color,
  };
}

/**
 * Version scoring map
 * 
 * Keeps track of known versions and their scores.
 * Latest stable version = max points (15)
 * Older versions receive progressively fewer points
 * 
 * @param version Software version string (e.g., "0.8.0")
 * @returns Score from 0-15 points
 */
function getVersionScore(version: string): number {
  // Version scoring map - update as new versions release
  const versionMap: Record<string, number> = {
    '0.8.0': 15,  // Latest stable (Munich/Herrenberg era)
    '0.7.3': 13,
    '0.7.2': 11,
    '0.7.1': 9,
    '0.7.0': 7,
    '0.6.x': 5,
    'unknown': 3,
  };

  // Check exact match first
  if (versionMap[version] !== undefined) {
    return versionMap[version];
  }

  // Fallback for unknown versions
  return versionMap['unknown'];
}

/**
 * Calculate reliability score based on multiple health indicators
 * 
 * Components:
 * - Active status (5 pts): Node is actively gossiping
 * - Storage health (3 pts): Storage usage under 80% threshold
 * - Uptime consistency (2 pts): Above network average uptime
 * 
 * @param pnode The pNode to evaluate
 * @param networkAvg Network averages for comparison
 * @returns Reliability score from 0-10 points
 */
function calculateReliability(
  pnode: PNode,
  networkAvg: NetworkAverage
): number {
  let score = 0;

  // Active status check (5 points)
  // Actively gossiping nodes are most reliable
  if (pnode.status === 'active') {
    score += 5;
  } else if (pnode.status === 'syncing') {
    score += 2; // Partial credit for syncing nodes
  }

  // Storage health check (3 points)
  // Nodes with <80% storage usage are healthy
  if (pnode.storageUsagePercent < 80) {
    score += 3;
  } else if (pnode.storageUsagePercent < 90) {
    score += 1; // Partial credit for 80-90%
  }

  // Uptime consistency (2 points)
  // Reward nodes that exceed network average
  if (pnode.uptime > networkAvg.uptime) {
    score += 2;
  }

  return Math.min(10, score);
}

/**
 * Determine letter grade and Tailwind color class based on score
 * 
 * Grading scale:
 * - A+ (95-100): Elite nodes - text-green-400
 * - A  (90-94):  Excellent nodes - text-green-500
 * - B+ (85-89):  Very good nodes - text-blue-400
 * - B  (80-84):  Good nodes - text-blue-500
 * - C+ (75-79):  Above average - text-yellow-400
 * - C  (70-74):  Average nodes - text-yellow-500
 * - D  (60-69):  Below average - text-orange-500
 * - F  (<60):    Poor performing - text-red-500
 * 
 * @param score Total XandScore (0-100)
 * @returns Object with grade letter and Tailwind color class
 */
function getScoreGrade(score: number): { grade: string; color: string } {
  if (score >= 95) return { grade: 'A+', color: 'text-green-400' };
  if (score >= 90) return { grade: 'A', color: 'text-green-500' };
  if (score >= 85) return { grade: 'B+', color: 'text-blue-400' };
  if (score >= 80) return { grade: 'B', color: 'text-blue-500' };
  if (score >= 75) return { grade: 'C+', color: 'text-yellow-400' };
  if (score >= 70) return { grade: 'C', color: 'text-yellow-500' };
  if (score >= 60) return { grade: 'D', color: 'text-orange-500' };
  return { grade: 'F', color: 'text-red-500' };
}

/**
 * Calculate network-wide averages from an array of pNodes
 * 
 * Used to provide relative scoring context for individual nodes
 * 
 * @param nodes Array of all pNodes in the cluster
 * @returns Network averages for uptime and storage
 */
export function calculateNetworkAverages(nodes: PNode[]): NetworkAverage {
  if (nodes.length === 0) {
    return {
      uptime: 0,
      storage: 0,
      activeNodeCount: 0,
    };
  }

  const totalUptime = nodes.reduce((sum, node) => sum + node.uptime, 0);
  const totalStorage = nodes.reduce((sum, node) => sum + node.storageCommitted, 0);
  const activeNodes = nodes.filter(node => node.status === 'active').length;

  return {
    uptime: totalUptime / nodes.length,
    storage: totalStorage / nodes.length,
    activeNodeCount: activeNodes,
  };
}

/**
 * Batch score calculation for multiple nodes
 * 
 * Efficiently scores all nodes in a cluster by calculating
 * network averages once and applying to all nodes
 * 
 * @param nodes Array of pNodes to score
 * @returns Array of pNodes with scoreBreakdown and score fields populated
 */
export function scoreAllNodes(nodes: PNode[]): PNode[] {
  const networkAvg = calculateNetworkAverages(nodes);

  return nodes.map(node => {
    const scoreBreakdown = calculateXandScore(node, networkAvg);
    return {
      ...node,
      scoreBreakdown,
      score: scoreBreakdown.total,
    };
  });
}
'use client';

import {
  Server,
  TrendingUp,
  Activity,
  Zap,
} from 'lucide-react';

import StatCardSkeleton from '@/app/components/skeletons/StatCardSkeleton';

const getScoreGrade = (score: number) => {
  if (score >= 95) return { grade: 'A+', color: 'text-green-400' };
  if (score >= 90) return { grade: 'A', color: 'text-green-500' };
  if (score >= 85) return { grade: 'B+', color: 'text-blue-400' };
  if (score >= 80) return { grade: 'B', color: 'text-blue-500' };
  if (score >= 75) return { grade: 'C+', color: 'text-yellow-400' };
  if (score >= 70) return { grade: 'C', color: 'text-yellow-500' };
  if (score >= 60) return { grade: 'D', color: 'text-orange-500' };
  return { grade: 'F', color: 'text-red-500' };
};

interface NetworkStats {
  total: number;
  active: number;
  avgScore: string;
  totalStorage: string;
  usedStorage: string;
  utilization: string;
}

interface Props {
  loading: boolean;
  networkStats: NetworkStats;
  cardClass: string;
  borderClass: string;
  mutedClass: string;
} 

export default function NetworkOverviewStats({
  loading,
  networkStats,
  cardClass,
  borderClass,
  mutedClass,
}: Props) {
  // 🔹 LOADING STATE
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // 🔹 REAL DATA
  return (
    <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
      
      {/* Total pNodes */}
      <div className={`${cardClass} p-3 rounded-lg border ${borderClass}`}>
        <div className="flex items-center justify-between mb-1">
          <span className={mutedClass}>Total pNodes</span>
          <Server className="w-4 h-4 text-purple-400" />
        </div>
        <div className="text-2xl font-bold leading-tight">
          {networkStats.total}
        </div>
        <div className="text-sm text-green-400 mt-1">
          {networkStats.active} active
        </div>
      </div>

      {/* Avg Score */}
      <div className={`${cardClass} p-3 rounded-lg border ${borderClass}`}>
        <div className="flex items-center justify-between mb-1">
          <span className={mutedClass}>Avg XandScore™</span>
          <TrendingUp className="w-4 h-4 text-blue-400" />
        </div>
        <div className="text-2xl font-bold leading-tight">
          {networkStats.avgScore}
        </div> 
        <div
          className={`text-sm mt-1 ${
            getScoreGrade(parseFloat(networkStats.avgScore)).color
          }`}
        >
          Grade: {getScoreGrade(parseFloat(networkStats.avgScore)).grade}
        </div>
      </div>

      {/* Storage */}
<div className={`${cardClass} p-3 rounded-lg border ${borderClass}`}>
  <div className="flex items-center justify-between mb-1">
    <span className={mutedClass}>Total Storage</span>
    <Activity className="w-4 h-4 text-green-400" />
  </div>
  <div className="text-2xl font-bold leading-tight">
    {networkStats.totalStorage}
  </div>
  <div className="text-sm text-blue-400 mt-1">
    {networkStats.usedStorage} used ({networkStats.utilization}%)
  </div>
</div>

      {/* Health */}
      <div className={`${cardClass} p-3 rounded-lg border ${borderClass}`}>
        <div className="flex items-center justify-between mb-1">
          <span className={mutedClass}>Network Health</span>
          <Zap className="w-4 h-4 text-yellow-400" />
        </div>
        <div className="text-2xl font-bold leading-tight text-green-400">
          {networkStats.active > networkStats.total * 0.7
            ? 'Healthy'
            : 'Degraded'}
        </div>
        <div className={`text-sm mt-1 ${mutedClass}`}>
          {networkStats.active > networkStats.total * 0.7
            ? 'All systems operational'
            : 'Some nodes offline'}
        </div>
      </div>

    </div>
  );
}

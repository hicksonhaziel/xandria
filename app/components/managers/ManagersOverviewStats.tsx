'use client';

import { Users2, Server, Activity, CheckCircle } from 'lucide-react';
import StatCardSkeleton from '@/app/components/skeletons/StatCardSkeleton';

interface ManagerStats {
  totalManagers: number;
  totalNodes: number;
  devnetNodes: number;
  mainnetNodes: number;
  activeNodes: number;
}

interface Props {
  loading: boolean;
  stats: ManagerStats | null;
  cardClass: string;
  borderClass: string;
  mutedClass: string;
}

export default function ManagersOverviewStats({
  loading,
  stats,
  cardClass,
  borderClass,
  mutedClass,
}: Props) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Managers */}
      <div className={`${cardClass} p-4 rounded-lg border ${borderClass}`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm ${mutedClass}`}>Total Managers</span>
          <Users2 className="w-5 h-5 text-purple-400" />
        </div>
        <div className="text-3xl font-bold">{stats.totalManagers}</div>
        <div className={`text-xs ${mutedClass} mt-1`}>
          Unique operators
        </div>
      </div>

      {/* Total Nodes */}
      <div className={`${cardClass} p-4 rounded-lg border ${borderClass}`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm ${mutedClass}`}>Total Nodes</span>
          <Server className="w-5 h-5 text-blue-400" />
        </div>
        <div className="text-3xl font-bold">{stats.totalNodes}</div>
        <div className={`text-xs ${mutedClass} mt-1`}>
          Registered pNodes
        </div>
      </div>

      {/* Network Distribution */}
      <div className={`${cardClass} p-4 rounded-lg border ${borderClass}`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm ${mutedClass}`}>Network Split</span>
          <Activity className="w-5 h-5 text-green-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-bold">{stats.devnetNodes}</div>
          <span className={`text-sm ${mutedClass}`}>devnet</span>
        </div>
        <div className={`text-xs ${mutedClass} mt-1`}>
          {stats.mainnetNodes} mainnet nodes
        </div>
      </div>

      {/* Active Nodes */}
      <div className={`${cardClass} p-4 rounded-lg border ${borderClass}`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm ${mutedClass}`}>Active Nodes</span>
          <CheckCircle className="w-5 h-5 text-green-500" />
        </div>
        <div className="text-3xl font-bold text-green-400">
          {stats.activeNodes}
        </div>
        <div className={`text-xs ${mutedClass} mt-1`}>
          {((stats.activeNodes / stats.totalNodes) * 100).toFixed(1)}% uptime
        </div>
      </div>
    </div>
  );
}
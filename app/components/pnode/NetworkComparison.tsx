'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { PNodeDetailResponse } from '@/app/types/pnode-detail';

interface Props {
  comparison: PNodeDetailResponse['data']['networkComparison'];
  darkMode: boolean;
}

export default function NetworkComparison({ comparison, darkMode }: Props) {
  const cardClass = darkMode ? 'bg-gray-800' : 'bg-white';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-600';

  const getPercentileIcon = (percentile: number) => {
    if (percentile >= 75) return <TrendingUp className="w-5 h-5 text-green-400" />;
    if (percentile >= 50) return <Minus className="w-5 h-5 text-yellow-400" />;
    return <TrendingDown className="w-5 h-5 text-red-400" />;
  };

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 75) return 'text-green-400';
    if (percentile >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className={`${cardClass} p-6 rounded-lg border ${borderClass} mb-6`}>
      <h2 className="text-xl font-bold mb-4">Network Comparison</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Uptime Percentile */}
        <div className={`p-4 rounded-lg border ${borderClass}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm ${mutedClass}`}>Uptime Percentile</span>
            {getPercentileIcon(comparison.uptimePercentile)}
          </div>
          <div className={`text-3xl font-bold ${getPercentileColor(comparison.uptimePercentile)}`}>
            {comparison.uptimePercentile}%
          </div>
          <div className={`text-xs ${mutedClass} mt-1`}>
            Better than {comparison.uptimePercentile}% of nodes
          </div>
        </div>

        {/* Storage Percentile */}
        <div className={`p-4 rounded-lg border ${borderClass}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm ${mutedClass}`}>Storage Percentile</span>
            {getPercentileIcon(comparison.storagePercentile)}
          </div>
          <div className={`text-3xl font-bold ${getPercentileColor(comparison.storagePercentile)}`}>
            {comparison.storagePercentile}%
          </div>
          <div className={`text-xs ${mutedClass} mt-1`}>
            Better than {comparison.storagePercentile}% of nodes
          </div>
        </div>
      </div>

      {/* Network averages */}
      <div className={`p-4 rounded-lg border ${borderClass}`}>
        <h3 className="font-semibold mb-3">Network Averages</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className={mutedClass}>Avg Uptime</p>
            <p className="font-bold">
              {Math.floor(comparison.networkAverage.uptime / 3600)}h
            </p>
          </div>
          <div>
            <p className={mutedClass}>Avg Storage</p>
            <p className="font-bold">
              {(comparison.networkAverage.storage / 1_000_000_000).toFixed(1)} GB
            </p>
          </div>
          <div className="col-span-2">
            <p className={mutedClass}>Total Network Nodes</p>
            <p className="font-bold">{comparison.totalNodes}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
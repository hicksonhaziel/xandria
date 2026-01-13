'use client';

import { Server, Clock, HardDrive, MapPin, TrendingUp, TrendingDown } from 'lucide-react';
import type { PNodeDetailResponse } from '@/app/types/pnode-detail';
import { useLocation } from '@/app/hooks/useLocations';
import { useNodeAnalytics } from '@/app/hooks/useNodeAnalytics';

interface Props {
  node: PNodeDetailResponse['data'];
  darkMode: boolean;
  network: 'devnet' | 'mainnet';
}
 
// Format storage
const formatStorage = (bytes: number): string => {
  const tb = bytes / 1_000_000_000_000;
  const gb = bytes / 1_000_000_000;
  if (tb >= 1) return `${tb.toFixed(1)} TB`;
  return `${gb.toFixed(1)} GB`;
};

// Format uptime
const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
};

// Format uptime change
const formatUptimeChange = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

export default function PNodeStatsGrid({ node, darkMode, network}: Props) {
  const cardClass = darkMode ? 'bg-[#111827]' : 'bg-white';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-600';

  // Fetch location for this node
  const { location, loading: locationLoading } = useLocation(node.ipAddress);

  // Fetch analytics for uptime and storage (1 hour period)
  const { data: analyticsData } = useNodeAnalytics(node.pubkey, {
    refreshInterval: 30000,
    autoRefresh: true,
    defaultPeriod: '1h',
    network,
  });

  // Calculate changes
  const uptimeChange = analyticsData?.stats?.metrics?.uptime?.change || 0;
  const storageChange = analyticsData?.stats?.metrics?.storagePercent?.change || 0;

  const stats = [
    {
      icon: Clock,
      label: 'Uptime',
      value: formatUptime(node.uptime),
      subtext: uptimeChange !== 0 ? (
        <div className="flex items-center gap-1">
          {uptimeChange > 0 ? (
            <TrendingUp className="w-3 h-3 text-green-400" />
          ) : (
            <TrendingDown className="w-3 h-3 text-red-400" />
          )}
          <span className={uptimeChange > 0 ? 'text-green-400' : 'text-red-400'}>
            {formatUptimeChange(Math.abs(uptimeChange))} this hour
          </span>
        </div>
      ) : (
        `${node.uptime.toLocaleString()}s`
      ),
      color: 'text-blue-400',
      isCustomSubtext: uptimeChange !== 0,
    },
    {
      icon: HardDrive,
      label: 'Storage',
      value: formatStorage(node.storageCommitted),
      subtext: storageChange !== 0 ? (
        <div className="flex items-center gap-1">
          {storageChange > 0 ? (
            <TrendingUp className="w-3 h-3 text-green-400" />
          ) : (
            <TrendingDown className="w-3 h-3 text-red-400" />
          )}
          <span className={storageChange > 0 ? 'text-green-400' : 'text-red-400'}>
            {Math.abs(storageChange).toFixed(3)}% this hour
          </span>
        </div>
      ) : (
        `${node.storageUsagePercent.toFixed(2)}% used`
      ),
      color: 'text-purple-400',
      isCustomSubtext: storageChange !== 0,
    },
    {
      icon: Server,
      label: 'Version',
      value: node.version,
      subtext: node.isPublic ? 'Public Node' : 'Private Node',
      color: 'text-yellow-400',
    },
    {
      icon: MapPin,
      label: 'Location',
      value: location ? (
        <div className="flex items-center gap-2">
          <span className="text-2xl leading-none">{location.flag}</span>
          <div className="flex flex-col">
            <span className="text-lg font-bold leading-tight">
              {location.countryName}
            </span>
            {location.city && (
              <span className={`text-xs ${mutedClass} leading-tight mt-0.5`}>
                {location.city}
              </span>
            )}
          </div>
        </div>
      ) : locationLoading ? (
        <span className="text-lg">...</span>
      ) : (
        <span className="text-lg">Unknown</span>
      ),
      subtext: location?.isp || (node.ipAddress || 'No IP'),
      color: 'text-green-400',
      isCustomValue: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className={`${cardClass} p-4 rounded-lg border ${borderClass}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm ${mutedClass}`}>{stat.label}</span>
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
          </div>
          <div className="mb-1">
            {stat.isCustomValue ? (
              stat.value
            ) : (
              <div className="text-xl font-bold">{stat.value}</div>
            )}
          </div>
          <div className={`text-xs ${mutedClass}`}>
            {stat.isCustomSubtext ? stat.subtext : stat.subtext}
          </div>
        </div>
      ))}
    </div>
  );
}
'use client';

import { Server, Clock, HardDrive, Activity, Cpu, Wifi } from 'lucide-react';
import type { PNodeDetailResponse } from '@/app/types/pnode-detail';

interface Props {
  node: PNodeDetailResponse['data'];
  darkMode: boolean;
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

// Format time ago
const formatTimeAgo = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return `${mins}m ago`;
};

export default function PNodeStatsGrid({ node, darkMode }: Props) {
  const cardClass = darkMode ? 'bg-gray-800' : 'bg-white';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-600';

  const stats = [
    {
      icon: Clock,
      label: 'Uptime',
      value: formatUptime(node.uptime),
      subtext: `${node.uptime.toLocaleString()}s`,
      color: 'text-blue-400',
    },
    {
      icon: Activity,
      label: 'Last Seen',
      value: formatTimeAgo(node.lastSeen),
      subtext: new Date(node.lastSeen).toLocaleString(),
      color: 'text-green-400',
    },
    {
      icon: HardDrive,
      label: 'Storage',
      value: formatStorage(node.storageCommitted),
      subtext: `${node.storageUsagePercent.toFixed(2)}% used`,
      color: 'text-purple-400',
    },
    {
      icon: Server,
      label: 'Version',
      value: node.version,
      subtext: node.isPublic ? 'Public Node' : 'Private Node',
      color: 'text-yellow-400',
    },
    {
      icon: Wifi,
      label: 'IP Address',
      value: node.ipAddress || 'Hidden',
      subtext: `Port ${node.rpcPort}`,
      color: 'text-orange-400',
    },
    {
      icon: Cpu,
      label: 'Response Time',
      value: `${node.responseTime}ms`,
      subtext: 'Network latency',
      color: 'text-pink-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className={`${cardClass} p-4 rounded-lg border ${borderClass}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm ${mutedClass}`}>{stat.label}</span>
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
          </div>
          <div className="text-xl font-bold mb-1">{stat.value}</div>
          <div className={`text-xs ${mutedClass}`}>{stat.subtext}</div>
        </div>
      ))}
    </div>
  );
}
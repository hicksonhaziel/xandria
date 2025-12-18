'use client';

import { Cpu, MemoryStick, Activity, HardDrive } from 'lucide-react';
import type { PNodeDetailResponse } from '@/app/types/pnode-detail';

interface Props {
  details: PNodeDetailResponse['data']['details'];
  darkMode: boolean;
}

// Format bytes to readable
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const gb = bytes / 1_000_000_000;
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  const mb = bytes / 1_000_000;
  return `${mb.toFixed(0)} MB`;
};

// Format numbers with commas
const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

export default function AdvancedMetrics({ details, darkMode }: Props) {
  if (!details?.result) {
    return (
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg border ${
        darkMode ? 'border-gray-700' : 'border-gray-200'
      } mb-6`}>
        <h2 className="text-xl font-bold mb-2">Advanced Metrics</h2>
        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
          Node is private or metrics unavailable
        </p>
      </div>
    );
  }

  const { result } = details;
  const cardClass = darkMode ? 'bg-gray-800' : 'bg-white';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-600';

  const ramPercent = (result.ram_used / result.ram_total) * 100;

  const metrics = [
    {
      icon: Cpu,
      label: 'CPU Usage',
      value: `${result.cpu_percent.toFixed(1)}%`,
      color: 'text-blue-400',
    },
    {
      icon: MemoryStick,
      label: 'RAM Usage',
      value: formatBytes(result.ram_used),
      subtext: `${ramPercent.toFixed(1)}% of ${formatBytes(result.ram_total)}`,
      color: 'text-purple-400',
    },
    {
      icon: Activity,
      label: 'Active Streams',
      value: result.active_streams.toString(),
      subtext: `Index: ${result.current_index}`,
      color: 'text-green-400',
    },
    {
      icon: HardDrive,
      label: 'File Size',
      value: formatBytes(result.file_size),
      subtext: `${formatNumber(result.total_pages)} pages`,
      color: 'text-orange-400',
    },
  ];

  return (
    <div className={`${cardClass} p-6 rounded-lg border ${borderClass} mb-6`}>
      <h2 className="text-xl font-bold mb-4">Advanced Metrics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {metrics.map((metric, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-lg border ${borderClass}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm ${mutedClass}`}>{metric.label}</span>
              <metric.icon className={`w-5 h-5 ${metric.color}`} />
            </div>
            <div className="text-xl font-bold mb-1">{metric.value}</div>
            {metric.subtext && (
              <div className={`text-xs ${mutedClass}`}>{metric.subtext}</div>
            )}
          </div>
        ))}
      </div>

      {/* Network stats */}
      <div className={`p-4 rounded-lg border ${borderClass}`}>
        <h3 className="font-semibold mb-3">Network Activity</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className={mutedClass}>Packets Received</p>
            <p className="font-bold">{formatNumber(result.packets_received)}</p>
          </div>
          <div>
            <p className={mutedClass}>Packets Sent</p>
            <p className="font-bold">{formatNumber(result.packets_sent)}</p>
          </div>
          <div>
            <p className={mutedClass}>Total Bytes</p>
            <p className="font-bold">{formatBytes(result.total_bytes)}</p>
          </div>
          <div>
            <p className={mutedClass}>Last Updated</p>
            <p className="font-bold">
              {new Date(result.last_updated * 1000).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
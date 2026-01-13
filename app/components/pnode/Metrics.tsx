'use client';

import {
  Coins,
  TrendingUp,
  TrendingDown,
  Calendar,
  Award,
  Loader2,
  AlertCircle,
  RefreshCw,
  Cpu,
  MemoryStick,
  Activity,
  HardDrive, 
} from 'lucide-react';

import { useNodeCredits } from '@/app/hooks/useCredits';
import { usePodCreditsAnalytics } from '@/app/hooks/usePodCreditsAnalytics';
import type { PNodeDetailResponse } from '@/app/types/pnode-detail';

interface Props {
  nodePubkey: string;
  details: PNodeDetailResponse['data']['details'];
  darkMode: boolean;
  network: 'devnet' | 'mainnet';
}

const formatBytes = (bytes: number): string => {
  if (!bytes) return '0 B';
  const gb = bytes / 1_000_000_000;
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  return `${(bytes / 1_000_000).toFixed(0)} MB`;
};

const formatNumber = (num: number) => num.toLocaleString();

const formatTime = (date: Date | null) =>
  date ? date.toLocaleTimeString() : 'N/A';


const getMonthFromTimestamp = (timestamp: any): string => {
  // Convert to Number to handle strings/BigInts
  const ts = Number(timestamp);
  const date = new Date(ts);
  
  // Safety check: if the date is invalid, return the current month
  if (isNaN(date.getTime())) {
    return new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  }
  
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};


export default function Metrics({
  nodePubkey,
  details,
  darkMode,
  network,
}: Props) {
  const {
    credits,
    loading: creditsLoading,
    error: creditsError,
    lastFetch,
    refresh,
    totalNodes,
  } = useNodeCredits(nodePubkey, {
    refreshInterval: 30000,
    autoRefresh: true,
    network,
  });

  
  const podId = nodePubkey; 
  const { 
    data: analyticsData, 
    loading: analyticsLoading 
  } = usePodCreditsAnalytics(podId, {
    refreshInterval: 30000,
    autoRefresh: true,
    defaultPeriod: '1h',
    network
  });

  const cardClass = darkMode ? 'bg-[#0B1220]' : 'bg-white';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-600';

  const result = details?.result;
  const ramPercent = result && (result.ram_used / result.ram_total) * 100;

  // Get credits change data
  const creditsChange = analyticsData?.stats?.changes?.last10min?.change || 0;
  const creditsChangePercent = analyticsData?.stats?.changes?.last10min?.percentChange || 0;

  // Find the earliest credit value we have in the current history
  const firstDataPoint = analyticsData?.history?.[analyticsData.history.length - 1]; // Use the LAST point in history as the start
  const currentCredits = analyticsData?.stats?.credits?.current || credits?.credits || credits?.balance || 0;
  
  // If we have history, show growth. If not, fallback to the total earned from the node itself.
  const monthlyEarned = firstDataPoint && (currentCredits - firstDataPoint.credits > 0)
    ? currentCredits - firstDataPoint.credits
    : (credits?.monthlyEarned || credits?.earnedThisMonth || 0);

    
  // Get month name
  const currentMonth = firstDataPoint 
    ? getMonthFromTimestamp(firstDataPoint.timestamp)
    : new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  const loading = creditsLoading || analyticsLoading;
  const error = creditsError;



  const creditStats = [
    {
      icon: Coins,
      label: 'Credit Balance',
      value: loading
        ? '...'
        : currentCredits.toLocaleString(),
      subtext: creditsChange !== 0 && !loading ? (
        <div className="flex items-center gap-1">
          {creditsChange > 0 ? (
            <TrendingUp className="w-3 h-3 text-green-400" />
          ) : (
            <TrendingDown className="w-3 h-3 text-red-400" />
          )}
          <span className={creditsChange > 0 ? 'text-green-400' : 'text-red-400'}>
            {Math.abs(creditsChange).toLocaleString()} this hour
          </span>
        </div>
      ) : undefined,
      color: 'text-yellow-400',
      isCustomSubtext: creditsChange !== 0 && !loading,
    },
    {
      icon: Award,
      label: 'Network Rank',
      value: loading ? '...' : credits?.rank?.toString() || 'N/A',
      subtext: totalNodes ? `of ${totalNodes}` : undefined,
      color: 'text-purple-400',
    },
    {
      icon: TrendingUp,
      label: `Earned in ${currentMonth.split(' ')[0]}`,
      value: loading
        ? '...'
        : monthlyEarned.toLocaleString(),
      subtext: `Earning Rate: ${analyticsData?.stats?.credits?.earningRate?.toFixed(1) || '0'}/hr`,
      color: 'text-green-400',
    },
    {
      icon: Calendar,
      label: 'Last Updated',
      value: loading ? '...' : formatTime(lastFetch),
      color: 'text-blue-400',
    },
  ];

  const systemMetrics = result
    ? [
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
          sub: `${ramPercent?.toFixed(1)}% of ${formatBytes(
            result.ram_total
          )}`,
          color: 'text-purple-400',
        },
        {
          icon: Activity,
          label: 'Active Streams',
          value: result.active_streams.toString(),
          sub: `Index ${result.current_index}`,
          color: 'text-green-400',
        },
        {
          icon: HardDrive,
          label: 'File Size',
          value: formatBytes(result.file_size),
          sub: `${formatNumber(result.total_pages)} pages`,
          color: 'text-orange-400',
        },
      ]
    : [];

 

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">

      {/* CREDITS */}
      <div className={`${cardClass} p-6 rounded-xl border ${borderClass}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Credits & Rewards</h2>
          <div className="flex items-center gap-2">
            {loading && (
              <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
            )}
            <button
              onClick={refresh}
              disabled={loading}
              className={`p-2 rounded-lg transition ${
                darkMode
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg border border-red-500/30 bg-red-500/10 flex gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {creditStats.map((stat, i) => (
            <div
              key={i}
              className={`p-4 rounded-lg border ${borderClass}`}
            >
              <div className="flex justify-between mb-2">
                <span className={`text-sm ${mutedClass}`}>{stat.label}</span>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.isCustomSubtext ? (
                <div className="text-xs">{stat.subtext}</div>
              ) : stat.subtext ? (
                <div className={`text-xs ${mutedClass}`}>{stat.subtext}</div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm text-blue-400">
            💡 Credits depend on uptime, storage contribution, and network reliability.
          </p>
        </div>
      </div>

      {/* METRICS */}
      <div className={`${cardClass} p-6 rounded-xl border ${borderClass}`}>
        <h2 className="text-xl font-bold mb-4">Advanced Metrics</h2>

        {!result ? (
          <p className={mutedClass}>Metrics unavailable (private node)</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {systemMetrics.map((m, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg border ${borderClass}`}
                >
                  <div className="flex justify-between mb-2">
                    <span className={`text-sm ${mutedClass}`}>{m.label}</span>
                    <m.icon className={`w-5 h-5 ${m.color}`} />
                  </div>
                  <div className="text-xl font-bold">{m.value}</div>
                  {m.sub && (
                    <div className={`text-xs ${mutedClass}`}>{m.sub}</div>
                  )}
                </div>
              ))}
            </div>

            <div className={`p-4 rounded-lg border ${borderClass}`}>
              <h3 className="font-semibold mb-3">Network Activity</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className={mutedClass}>Packets Received</p>
                  <p className="font-bold">
                    {formatNumber(result.packets_received)}
                  </p>
                </div>
                <div>
                  <p className={mutedClass}>Packets Sent</p>
                  <p className="font-bold">
                    {formatNumber(result.packets_sent)}
                  </p>
                </div>
                <div>
                  <p className={mutedClass}>Total Bytes</p>
                  <p className="font-bold">
                    {formatBytes(result.total_bytes)}
                  </p>
                </div>
                <div>
                  <p className={mutedClass}>Last Updated</p>
                  <p className="font-bold">
                    {new Date(result.last_updated * 1000).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
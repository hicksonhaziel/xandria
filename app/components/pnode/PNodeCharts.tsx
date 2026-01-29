'use client';

import { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  LineChart, 
  Line,
} from 'recharts';
import type { PNodeDetailResponse } from '@/app/types/pnode-detail';
import { useNodeAnalytics } from '@/app/hooks/useNodeAnalytics';
import { Loader2 } from 'lucide-react';

interface Props {
  node: PNodeDetailResponse['data'];
  darkMode: boolean;
  network: 'devnet' | 'mainnet';
}

type TimePeriod = '10min' | '1h' | '24h' | '7d';

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, darkMode }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div
        className={`p-3 rounded-lg border ${
          darkMode 
            ? 'bg-[#111827] border-gray-700' 
            : 'bg-white border-gray-200'
        } shadow-lg`}
      >
        <p className="text-sm font-semibold mb-1">{payload[0].value} {payload[0].name === 'uptime' ? 'hours' : ''}</p>
        <p className="text-xs text-gray-400">{data.timestamp}</p>
        <p className="text-xs text-gray-500">{data.date}</p>
      </div>
    );
  }
  return null;
};

export default function PNodeCharts({ node, darkMode, network }: Props) {
  const cardClass = darkMode ? 'bg-[#0B1220]' : 'bg-white';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';
  const gridStroke = darkMode ? '#374151' : '#e5e7eb';

  // State for time periods
  const [uptimePeriod, setUptimePeriod] = useState<TimePeriod>('24h');
  const [xanScorePeriod, setXanScorePeriod] = useState<TimePeriod>('24h');

  // Fetch analytics data
  const uptimeAnalytics = useNodeAnalytics(node.pubkey, {
    refreshInterval: 30000,
    autoRefresh: true,
    defaultPeriod: uptimePeriod,
    network,
  });

  const xanScoreAnalytics = useNodeAnalytics(node.pubkey, {
    refreshInterval: 30000,
    autoRefresh: true,
    defaultPeriod: xanScorePeriod,
    network
  });

  

  const scoreData = [
    { name: 'Uptime', value: node.scoreBreakdown?.uptime, max: 30 },
    { name: 'Response', value: node.scoreBreakdown?.responseTime, max: 25 },
    { name: 'Storage', value: node.scoreBreakdown?.storage, max: 20 },
    { name: 'Version', value: node.scoreBreakdown?.version, max: 15 },
    { name: 'Reliability', value: node.scoreBreakdown?.reliability, max: 10 },
  ];

  const totalPossible = scoreData.reduce((a, b) => a + b.max, 0);
  const totalScore = node.scoreBreakdown?.total;

 
  const networkComparisonData = [
    {
      metric: 'Uptime',
      node: node.networkComparison.uptimePercentile,
      average: 50,
    },
    {
      metric: 'Storage',
      node: node.networkComparison.storagePercentile,
      average: 50,
    },
  ];


  const uptimeHistoricalData = uptimeAnalytics.data?.history.map(point => {
    // Ensure we convert String/BigInt to a standard Number
    const ts = Number(point.timestamp);
    const dateObj = new Date(ts);

    return {
      timestamp: isNaN(dateObj.getTime()) 
        ? 'Invalid' 
        : dateObj.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
      date: isNaN(dateObj.getTime())
        ? 'Invalid'
        : dateObj.toLocaleDateString([], {
            year: '2-digit',
            month: '2-digit',
            day: '2-digit'
          }),
      uptime: Math.floor(point.uptime / 3600), 
      fullTimestamp: ts
    };
  }).reverse() || [];
  

  const xanScoreHistoricalData = xanScoreAnalytics.data?.history
    .filter(point => point.xanScore !== undefined)
    .map(point => {
      // Ensure we convert String/BigInt to a standard Number
      const ts = Number(point.timestamp);
      const dateObj = new Date(ts);

      return {
        timestamp: isNaN(dateObj.getTime()) 
          ? 'Invalid' 
          : dateObj.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
        date: isNaN(dateObj.getTime())
          ? 'Invalid'
          : dateObj.toLocaleDateString([], {
              year: '2-digit',
              month: '2-digit',
              day: '2-digit'
            }),
        xanScore: point.xanScore,
        fullTimestamp: ts
      };
    }).reverse() || [];
  
  const TimePeriodSelector = ({ 
    current, 
    onChange 
  }: { 
    current: TimePeriod; 
    onChange: (period: TimePeriod) => void 
  }) => {
    const periods: TimePeriod[] = ['10min', '1h', '24h', '7d'];
    const labels: Record<TimePeriod, string> = {
      '10min': '10m',
      '1h': '1h',
      '24h': '24h',
      '7d': '7d'
    };

    return (
      <div className="flex gap-1">
        {periods.map(period => (
          <button
            key={period}
            onClick={() => onChange(period)}
            className={`px-2 py-1 text-xs rounded transition ${
              current === period
                ? darkMode 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-purple-500 text-white'
                : darkMode
                  ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {labels[period]}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

      {/*
          SCORE BREAKDOWN CHART
       */}
      <div className={`${cardClass} p-6 rounded-xl border ${borderClass}`}>
        <h3 className="text-lg font-semibold mb-1">Score Breakdown</h3>
        <p className="text-sm text-gray-400 mb-4">
          Contribution of each factor to the total score
        </p>

        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={scoreData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis type="number" stroke="currentColor" />
            <YAxis dataKey="name" type="category" stroke="currentColor" />
            <Tooltip
              contentStyle={{
                backgroundColor: darkMode ? '#111827' : '#ffffff',
                border: `1px solid ${gridStroke}`,
                borderRadius: '0.5rem',
              }}
              formatter={(value: number, name: string, props: any) => [
                `${value} / ${props.payload.max}`,
                'Score',
              ]}
            />

            {/* Actual score */}
            <Bar dataKey="value" fill="#8b5cf6" radius={[0, 6, 6, 0]} />

            {/* Max score reference */}
            <Bar dataKey="max" fill="#8b5cf6" opacity={0.15} />
          </BarChart>
        </ResponsiveContainer>

        {/* TOTAL SCORE */}
        <div className="mt-4 text-sm text-gray-400">
          Total Score:{' '}
          <span className="font-bold text-white">
            {totalScore} / {totalPossible}
          </span>
        </div>
      </div>

      {/* 
          NETWORK COMPARISON CHART
      */}
      <div className={`${cardClass} p-6 rounded-xl border ${borderClass}`}>
        <h3 className="text-lg font-semibold mb-1">Network Comparison</h3>
        <p className="text-sm text-gray-400 mb-4">
          Node performance vs network median
        </p>

        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={networkComparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="metric" stroke="currentColor" />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              stroke="currentColor"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: darkMode ? '#111827' : '#ffffff',
                border: `1px solid ${gridStroke}`,
                borderRadius: '0.5rem',
              }}
              formatter={(value: number) => `${value}%`}
            />

            {/* Network median line */}
            <ReferenceLine
              y={50}
              stroke="#64748b"
              strokeDasharray="4 4"
              label={{ value: 'Network Median', fill: '#94a3b8', fontSize: 12 }}
            />

            {/* Node percentile */}
            <Bar dataKey="node" fill="#22c55e" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-4 text-sm text-gray-400">
          Compared against {node.networkComparison.totalNodes} nodes
        </div>
        
        {/* CONTEXT TEXT */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
            <span className="text-gray-400">
              Uptime: Better than{' '}
              <span className="font-semibold text-white">
                {node.networkComparison.uptimePercentile}%
              </span>{' '}
              of nodes
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-gray-400">
              Storage: Better than{' '}
              <span className="font-semibold text-white">
                {node.networkComparison.storagePercentile}%
              </span>{' '}
              of nodes
            </span>
          </div>
        </div>
      </div>

      {/* 
          UPTIME HISTORY CHART
     */}
      <div className={`${cardClass} p-6 rounded-xl border ${borderClass}`}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-semibold">Uptime History</h3>
          <TimePeriodSelector 
            current={uptimePeriod} 
            onChange={(period) => {
              setUptimePeriod(period);
              uptimeAnalytics.changePeriod(period);
            }} 
          />
        </div>
        <p className="text-sm text-gray-400 mb-4">
          Node uptime trend over time
        </p>

        {uptimeAnalytics.loading && !uptimeAnalytics.data ? (
          <div className="flex items-center justify-center h-[280px]">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : uptimeHistoricalData.length === 0 ? (
          <div className="flex items-center justify-center h-[280px] text-gray-400">
            No historical data available yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={uptimeHistoricalData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis 
                dataKey="timestamp" 
                stroke="currentColor"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                stroke="currentColor"
                tickFormatter={(value) => `${value}h`}
              />
              <Tooltip
                content={<CustomTooltip darkMode={darkMode} />}
              />
              <Line 
                type="monotone" 
                dataKey="uptime" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 2, stroke: '#3b82f6' }}
                filter="drop-shadow(0px 2px 4px rgba(59, 130, 246, 0.3))"
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        <div className="mt-4 text-sm text-gray-400">
          💡 Uptime measures how long the node has been continuously running. Higher uptime contributes to better scores and network reliability.
        </div>
      </div>

      {/*
          XANSCORE HISTORY CHART
    */}
      <div className={`${cardClass} p-6 rounded-xl border ${borderClass}`}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-semibold">XanScore History</h3>
          <TimePeriodSelector 
            current={xanScorePeriod} 
            onChange={(period) => {
              setXanScorePeriod(period);
              xanScoreAnalytics.changePeriod(period);
            }} 
          />
        </div>
        <p className="text-sm text-gray-400 mb-4">
          XanScore performance over time (max 100)
        </p>

        {xanScoreAnalytics.loading && !xanScoreAnalytics.data ? (
          <div className="flex items-center justify-center h-[280px]">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        ) : xanScoreHistoricalData.length === 0 ? (
          <div className="flex items-center justify-center h-[280px] text-gray-400">
            No XanScore data available yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={xanScoreHistoricalData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis 
                dataKey="timestamp" 
                stroke="currentColor"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                domain={[0, 100]}
                stroke="currentColor"
              />
              <Tooltip
                content={<CustomTooltip darkMode={darkMode} />}
              />
              
              {/* Reference line at 50 */}
              <ReferenceLine
                y={50}
                stroke="#64748b"
                strokeDasharray="4 4"
                label={{ value: 'Average', fill: '#94a3b8', fontSize: 12 }}
              />
              
              <Line 
                type="monotone" 
                dataKey="xanScore" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 2, stroke: '#8b5cf6' }}
                filter="drop-shadow(0px 2px 4px rgba(139, 92, 246, 0.3))"
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        <div className="mt-4 text-sm text-sm text-gray-400">
          💡 XanScore is a comprehensive metric that evaluates node quality based on multiple factors. Scores above 75 indicate excellent performance.
        </div>
      </div>
    </div>
  );
}
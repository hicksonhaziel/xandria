'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import type { PNodeDetailResponse } from '@/app/types/pnode-detail';

interface Props {
  node: PNodeDetailResponse['data'];
  darkMode: boolean;
}

export default function PNodeCharts({ node, darkMode }: Props) {
  const cardClass = darkMode ? 'bg-[#0B1220]' : 'bg-white';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';
  const gridStroke = darkMode ? '#374151' : '#e5e7eb';

  /* ---------------------------------------------
     SCORE BREAKDOWN (WITH TOTAL CONTEXT)
  --------------------------------------------- */

  const scoreData = [
    { name: 'Uptime', value: node.scoreBreakdown?.uptime, max: 30 },
    { name: 'Response', value: node.scoreBreakdown?.responseTime, max: 25 },
    { name: 'Storage', value: node.scoreBreakdown?.storage, max: 20 },
    { name: 'Version', value: node.scoreBreakdown?.version, max: 15 },
    { name: 'Reliability', value: node.scoreBreakdown?.reliability, max: 10 },
  ];

  const totalPossible = scoreData.reduce((a, b) => a + b.max, 0);
  const totalScore = node.scoreBreakdown?.total;

  /* ---------------------------------------------
     NETWORK COMPARISON DATA
  --------------------------------------------- */

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

      {/* ===============================
          SCORE BREAKDOWN CHART
      =============================== */}
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

      {/* ===============================
          NETWORK COMPARISON CHART
      =============================== */}
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
    </div>
  );
}

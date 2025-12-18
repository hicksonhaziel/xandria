'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { PNodeDetailResponse } from '@/app/types/pnode-detail';

interface Props {
  node: PNodeDetailResponse['data'];
  darkMode: boolean;
}

export default function PNodeCharts({ node, darkMode }: Props) {
  const cardClass = darkMode ? 'bg-gray-800' : 'bg-white';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';

  // Score breakdown visualization data
  const scoreData = [
    { category: 'Uptime', score: node.scoreBreakdown?.uptime || 0, max: 30 },
    { category: 'Response', score: node.scoreBreakdown?.responseTime, max: 25 },
    { category: 'Storage', score: node.scoreBreakdown?.storage, max: 20 },
    { category: 'Version', score: node.scoreBreakdown?.version, max: 15 },
    { category: 'Reliability', score: node.scoreBreakdown?.reliability, max: 10 },
  ];

  // Network activity data (if available)
  const networkData = node.details?.result ? [
    { label: 'Received', value: node.details.result.packets_received },
    { label: 'Sent', value: node.details.result.packets_sent },
  ] : [];

  // Resource usage data (if available)
  const resourceData = node.details?.result ? [
    { 
      resource: 'CPU', 
      usage: node.details.result.cpu_percent,
      max: 100 
    },
    { 
      resource: 'RAM', 
      usage: (node.details.result.ram_used / node.details.result.ram_total) * 100,
      max: 100 
    },
    { 
      resource: 'Storage', 
      usage: node.storageUsagePercent,
      max: 100 
    },
  ] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      
      {/* Score Components Chart */}
      <div className={`${cardClass} p-6 rounded-xl border ${borderClass}`}>
        <h3 className="text-lg font-semibold mb-4">Score Components</h3>
        
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={scoreData}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={darkMode ? '#374151' : '#e5e7eb'} 
            />
            <XAxis 
              dataKey="category" 
              stroke="currentColor"
              tick={{ fontSize: 12 }}
            />
            <YAxis stroke="currentColor" />
            <Tooltip
              contentStyle={{
                backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                borderRadius: '0.5rem',
                color: darkMode ? '#fff' : '#000',
              }}
            />
            <Area 
              type="monotone" 
              dataKey="score" 
              stroke="#8b5cf6" 
              fill="#8b5cf6" 
              fillOpacity={0.6}
            />
            <Area 
              type="monotone" 
              dataKey="max" 
              stroke="#6366f1" 
              fill="#6366f1" 
              fillOpacity={0.2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Network Activity Chart */}
      {networkData.length > 0 ? (
        <div className={`${cardClass} p-6 rounded-xl border ${borderClass}`}>
          <h3 className="text-lg font-semibold mb-4">Network Activity</h3>
          
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={networkData}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={darkMode ? '#374151' : '#e5e7eb'} 
              />
              <XAxis 
                dataKey="label" 
                stroke="currentColor" 
              />
              <YAxis 
                stroke="currentColor"
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                  return value;
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                  border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '0.5rem',
                  color: darkMode ? '#fff' : '#000',
                }}
                formatter={(value: number) => value.toLocaleString()}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#10b981" 
                fill="#10b981" 
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        // Percentile comparison chart for private nodes
        <div className={`${cardClass} p-6 rounded-xl border ${borderClass}`}>
          <h3 className="text-lg font-semibold mb-4">Network Percentiles</h3>
          
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={[
              { metric: 'Uptime', percentile: node.networkComparison.uptimePercentile },
              { metric: 'Storage', percentile: node.networkComparison.storagePercentile },
            ]}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={darkMode ? '#374151' : '#e5e7eb'} 
              />
              <XAxis dataKey="metric" stroke="currentColor" />
              <YAxis 
                stroke="currentColor" 
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                  border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '0.5rem',
                  color: darkMode ? '#fff' : '#000',
                }}
                formatter={(value: number) => `${value}%`}
              />
              <Line 
                type="monotone" 
                dataKey="percentile" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ r: 6, fill: '#3b82f6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Resource Usage Chart (only for public nodes) */}
      {resourceData && (
        <div className={`${cardClass} p-6 rounded-xl border ${borderClass} lg:col-span-2`}>
          <h3 className="text-lg font-semibold mb-4">Resource Usage</h3>
          
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={resourceData}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={darkMode ? '#374151' : '#e5e7eb'} 
              />
              <XAxis dataKey="resource" stroke="currentColor" />
              <YAxis 
                stroke="currentColor"
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                  border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '0.5rem',
                  color: darkMode ? '#fff' : '#000',
                }}
                formatter={(value: number) => `${value.toFixed(2)}%`}
              />
              <Area 
                type="monotone" 
                dataKey="usage" 
                stroke="#f59e0b" 
                fill="#f59e0b" 
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  );
}
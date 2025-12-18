'use client';

import type { PNodeDetailResponse } from '@/app/types/pnode-detail';

interface Props {
  node: PNodeDetailResponse['data'];
  darkMode: boolean;
}

export default function ScoreBreakdown({ node, darkMode }: Props) {
  const cardClass = darkMode ? 'bg-gray-800' : 'bg-white';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-600';

  const breakdown = [
    { label: 'Uptime', value: node.scoreBreakdown?.uptime, max: 30 },
    { label: 'Response Time', value: node.scoreBreakdown?.responseTime, max: 25 },
    { label: 'Storage', value: node.scoreBreakdown?.storage, max: 20 },
    { label: 'Version', value: node.scoreBreakdown?.version, max: 15 },
    { label: 'Reliability', value: node.scoreBreakdown?.reliability, max: 10 },
  ];

  return (
    <div className={`${cardClass} p-6 rounded-lg border ${borderClass} mb-6`}>
      <h2 className="text-xl font-bold mb-4">Score Breakdown</h2>
      
      <div className="space-y-4">
        {breakdown.map((item, idx) => {
          const percent = item.value ? (item.value / item.max) * 100 : 0;
          
          return (
            <div key={idx}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{item.label}</span>
                <span className="text-sm font-bold">
                  {item.value?.toFixed(1)} / {item.max}
                </span>
              </div>
              
              {/* Progress bar */}
              <div className={`h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}

        {/* Total */}
        <div className="pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <span className="font-bold">Total Score</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{node.score?.toFixed(1)}</span>
              <span className={`text-lg font-semibold ${node.scoreBreakdown?.color}`}>
                {node.scoreBreakdown?.grade}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { AlertCircle, Info, AlertTriangle, XCircle } from 'lucide-react';
import type { Recommendation } from '@/app/types/pnode-detail';

interface Props {
  recommendations: Recommendation[];
  darkMode: boolean;
}

export default function Recommendations({ recommendations, darkMode }: Props) {
  if (recommendations.length === 0) return null;

  const cardClass = darkMode ? 'bg-gray-800' : 'bg-white';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';

  const getSeverityConfig = (severity: Recommendation['severity']) => {
    switch (severity) {
      case 'critical':
        return {
          icon: XCircle,
          bgClass: 'bg-red-500/20',
          textClass: 'text-red-400',
          borderClass: 'border-red-500/30',
        };
      case 'high':
        return {
          icon: AlertCircle,
          bgClass: 'bg-orange-500/20',
          textClass: 'text-orange-400',
          borderClass: 'border-orange-500/30',
        };
      case 'medium':
        return {
          icon: AlertTriangle,
          bgClass: 'bg-yellow-500/20',
          textClass: 'text-yellow-400',
          borderClass: 'border-yellow-500/30',
        };
      default:
        return {
          icon: Info,
          bgClass: 'bg-blue-500/20',
          textClass: 'text-blue-400',
          borderClass: 'border-blue-500/30',
        };
    }
  };

  return (
    <div className={`${cardClass} p-6 rounded-lg border ${borderClass}`}>
      <h2 className="text-xl font-bold mb-4">Recommendations</h2>
      
      <div className="space-y-3">
        {recommendations.map((rec, idx) => {
          const config = getSeverityConfig(rec.severity);
          const Icon = config.icon;

          return (
            <div
              key={idx}
              className={`p-4 rounded-lg border ${config.borderClass} ${config.bgClass}`}
            >
              <div className="flex gap-3">
                <Icon className={`w-5 h-5 ${config.textClass} flex-shrink-0 mt-0.5`} />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">{rec.category}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${config.bgClass} ${config.textClass}`}>
                      {rec.severity}
                    </span>
                  </div>
                  
                  <p className="text-sm mb-2">{rec.message}</p>
                  
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <strong>Action:</strong> {rec.action}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
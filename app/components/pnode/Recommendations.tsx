'use client';

import { useState } from 'react';
import { AlertCircle, Info, AlertTriangle, XCircle, Sparkles, Loader2, MessageCircle, TrendingUp, Activity, Bell } from 'lucide-react';
import type { Recommendation } from '@/app/types/pnode-detail';

interface Props {
  recommendations: Recommendation[];
  nodeData: any;
  darkMode: boolean;
}


export default function Recommendations({ recommendations, nodeData, darkMode }: Props) {

  const cardClass = darkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200';
  
  const getSeverityConfig = (severity: Recommendation['severity']) => {
    switch (severity) {
      case 'critical': return { icon: XCircle, bgClass: 'bg-red-500/10', textClass: 'text-red-400', borderClass: 'border-red-500/20' };
      case 'high': return { icon: AlertCircle, bgClass: 'bg-orange-500/10', textClass: 'text-orange-400', borderClass: 'border-orange-500/20' };
      case 'medium': return { icon: AlertTriangle, bgClass: 'bg-yellow-500/10', textClass: 'text-yellow-400', borderClass: 'border-yellow-500/20' };
      default: return { icon: Info, bgClass: 'bg-blue-500/10', textClass: 'text-blue-400', borderClass: 'border-blue-500/20' };
    }
  };

  return (
    <div className={`p-6 rounded-xl border ${cardClass} space-y-6 shadow-xl`}>
      
      {/* STANDARD RECOMMENDATIONS */}
      <div>
        <h2 className="text-xl font-bold mb-4">Action Items</h2>
        <div className="space-y-3">
          {recommendations.length === 0 ? (
            <div className="flex items-center gap-2 text-green-500">
              <Activity className="w-4 h-4" />
              <p className="text-sm font-medium">Your node is perfectly optimized</p>
            </div>
          ) : (
            recommendations.map((rec, idx) => {
              const config = getSeverityConfig(rec.severity);
              const Icon = config.icon;
              return (
                <div key={idx} className={`p-4 rounded-lg border ${config.borderClass} ${config.bgClass}`}>
                  <div className="flex gap-3">
                    <Icon className={`w-5 h-5 ${config.textClass} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{rec.category}</span>
                      </div>
                      <p className="text-sm mb-2">{rec.message}</p>
                      <div className={`text-xs p-2 rounded ${darkMode ? 'bg-black/20 text-gray-400' : 'bg-white/50 text-gray-600'}`}>
                        <strong className={config.textClass}>Recommended Action:</strong> {rec.action}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
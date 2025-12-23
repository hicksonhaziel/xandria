'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Info, AlertTriangle, XCircle, Sparkles, Loader2 } from 'lucide-react';
import type { Recommendation } from '@/app/types/pnode-detail';

interface Props {
  recommendations: Recommendation[];
  nodeData: any; // Pass the full data object here
  darkMode: boolean;
}

export default function Recommendations({ recommendations, nodeData, darkMode }: Props) {
  const [aiReview, setAiReview] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Fetch AI Review on component mount
  useEffect(() => {
    async function getAIAnalysis() {
      if (!nodeData) return;
      setIsAiLoading(true);
      try {
        const response = await fetch('/api/ai-review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nodeData }),
        });
        const result = await response.json();
        setAiReview(result.review);
      } catch (err) {
        console.error("AI Fetch Error:", err);
        setAiReview("Failed to load AI insights. Ensure your API route is configured.");
      } finally {
        setIsAiLoading(false);
      }
    }

    getAIAnalysis();
  }, [nodeData?.pubkey]); // Re-run if switching nodes

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
      
      {/* AI AI INSIGHTS SECTION */}
      <div className={`p-5 rounded-lg border-2 border-purple-500/30 bg-gradient-to-br ${darkMode ? 'from-purple-900/20 to-transparent' : 'from-purple-50/50 to-white'}`}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            XandExpert AI Review
          </h2>
        </div>

        {isAiLoading ? (
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing node performance...
          </div>
        ) : (
          <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'} italic`}>
            "{aiReview}"
          </p>
        )}
      </div>

      <hr className={darkMode ? 'border-gray-800' : 'border-gray-100'} />

      {/* STANDARD RECOMMENDATIONS */}
      <div>
        <h2 className="text-xl font-bold mb-4">Action Items</h2>
        <div className="space-y-3">
          {recommendations.length === 0 ? (
            <p className="text-sm text-green-500 font-medium">✨ Your node is perfectly optimized!</p>
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
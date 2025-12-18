'use client';

import { RefreshCw, Clock } from 'lucide-react';

interface Props {
  lastUpdate: number;
  refreshing: boolean;
  onRefresh: () => void;
  darkMode: boolean;
}

export default function LiveUpdateIndicator({ 
  lastUpdate, 
  refreshing, 
  onRefresh,
  darkMode 
}: Props) {
  const formatLastUpdate = (timestamp: number): string => {
    if (!timestamp) return 'Never';
    
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  return (
    <div className={`flex items-center gap-4 mb-4 px-4 py-2 rounded-lg ${
      darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-100 border border-gray-200'
    }`}>
      
      {/* Live indicator */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          refreshing ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'
        }`} />
        <span className="text-sm font-medium">
          {refreshing ? 'Updating...' : 'Live'}
        </span>
      </div>

      {/* Last update time */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Clock className="w-4 h-4" />
        <span>Updated {formatLastUpdate(lastUpdate)}</span>
      </div>

      {/* Manual refresh button */}
      <button
        onClick={onRefresh}
        disabled={refreshing}
        className={`ml-auto flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors ${
          darkMode 
            ? 'bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800' 
            : 'bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        Refresh
      </button>

      {/* Auto-refresh notice */}
      <span className="text-xs text-gray-500">
        Auto-refresh: 30s
      </span>
    </div>
  );
}
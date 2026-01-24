'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';
import { useLeaderboard } from '@/app/hooks/useLeaderboard';
import { useSidebarCollapse } from '@/app/hooks/useSidebarCollapse';
import Header from '@/app/components/Header';
import Sidebar from '@/app/components/Sidebar';
import { 
  Trophy, 
  Clock, 
  HardDrive, 
  RefreshCw,
  Loader2,
  AlertCircle,
  ChevronRight
} from 'lucide-react';

export default function LeaderboardPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sidebarCollapsed = useSidebarCollapse();
  const router = useRouter();
  const { darkMode } = useAppContext();
  
  const [selectedLimit, setSelectedLimit] = useState(100);
  
  const { 
    data, 
    loading, 
    refreshing, 
    error, 
    lastUpdate, 
    cached,
    refresh 
  } = useLeaderboard({ 
    limit: selectedLimit, 
    refreshInterval: 30000, 
    autoRefresh: true 
  });

  const bgClass = darkMode ? 'bg-[#0B0F14]' : 'bg-gray-50';
  const cardClass = darkMode 
    ? 'bg-[#111827] bg-opacity-50 backdrop-blur-lg' 
    : 'bg-white bg-opacity-70 backdrop-blur-lg';
  const textClass = darkMode ? 'text-gray-100' : 'text-gray-900';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-600';
  const borderClass = darkMode ? 'border-gray-800' : 'border-gray-200';

  const formatPubkey = (pubkey: string) => {
    return `${pubkey.slice(0, 8)}...${pubkey.slice(-6)}`;
  };

  const formatStorage = (bytes: number) => {
    const gb = bytes / (1024 ** 3);
    if (gb >= 1000) {
      return `${(gb / 1000).toFixed(2)} TB`;
    }
    return `${gb.toFixed(2)} GB`;
  };

  const formatUptime = (uptimeValue: number) => {
    // If uptime is a percentage (0-100)
    if (uptimeValue <= 100) {
      return `${uptimeValue.toFixed(1)}%`;
    }
    
    // If uptime is in seconds
    const seconds = uptimeValue;
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getScoreGrade = (score: number) => {
    if (score >= 95) return { grade: 'A+', color: darkMode ? 'text-green-400' : 'text-green-600' };
    if (score >= 90) return { grade: 'A', color: darkMode ? 'text-green-500' : 'text-green-700' };
    if (score >= 85) return { grade: 'B+', color: darkMode ? 'text-blue-400' : 'text-blue-600' };
    if (score >= 80) return { grade: 'B', color: darkMode ? 'text-blue-500' : 'text-blue-700' };
    if (score >= 75) return { grade: 'C+', color: darkMode ? 'text-yellow-400' : 'text-yellow-600' };
    if (score >= 70) return { grade: 'C', color: darkMode ? 'text-yellow-500' : 'text-yellow-700' };
    return { grade: 'D', color: darkMode ? 'text-orange-500' : 'text-orange-700' };
  };

  const getStatusColor = (status: string) => {
    if (status === 'active') return 'bg-green-500';
    if (status === 'syncing') return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleNodeClick = (pubkey: string) => {
    router.push(`/pnodes/${pubkey}`);
  };

  if (error) {
    return (
      <div className={`min-h-screen ${bgClass} ${textClass}`}>
        <Header />
        <Sidebar />
        <div className={`pt-20 px-6 transition-all duration-200 ${sidebarCollapsed ? 'lg:ml-[4.5rem]' : 'lg:ml-64'}`}>
          <div className="container mx-auto px-4 py-8">
            <div className={`${cardClass} border ${borderClass} rounded-xl p-12 text-center`}>
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Error Loading Leaderboard</h2>
              <p className={`${mutedClass} text-sm`}>{error}</p>
              <button 
                onClick={refresh}
                className={`mt-4 px-4 py-2 rounded-lg border ${borderClass} hover:shadow-sm transition-all`}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`min-h-screen ${bgClass} ${textClass} transition-colors duration-300`}>
      <Header />
      <Sidebar />

      <div className={`pt-20 pb-24 lg:pb-8 px-4 sm:px-6 lg:ml-64 min-h-screen`}>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
              <div>
                <h1 className="text-3xl font-bold mb-1">Leaderboard</h1>
                <p className={`${mutedClass} text-sm`}>
                  Top {selectedLimit} performing nodes
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border ${borderClass}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${refreshing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
                  <span className="font-medium">
                    {refreshing ? 'Updating' : `${Math.floor((Date.now() - lastUpdate) / 1000)}s ago`}
                  </span>
                </div>

                <button
                  onClick={refresh}
                  disabled={refreshing}
                  className={`p-2 rounded-lg border ${borderClass} hover:shadow-sm transition-all disabled:opacity-50`}
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Top 3 Cards */}
          {!loading && data.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {data.slice(0, 3).map((entry, idx) => {
                const { grade, color } = getScoreGrade(entry.score);
                const rankLabels = ['1st', '2nd', '3rd'];
                
                return (
                  <div
                    key={entry.pubkey}
                    onClick={() => handleNodeClick(entry.pubkey)}
                    className={`${cardClass} border ${borderClass} rounded-lg p-4 cursor-pointer hover:shadow-md hover:scale-105 transition-all ${
                      idx === 0 ? 'md:order-2' : idx === 1 ? 'md:order-1 md:mt-4' : 'md:order-3 md:mt-4'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-2xl font-bold ${mutedClass}`}>#{entry.rank}</span>
                        {idx === 0 && <Trophy className="w-5 h-5 text-yellow-500" />}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                        {rankLabels[idx]}
                      </span>
                    </div>

                    <div className="font-mono text-sm mb-3">{formatPubkey(entry.pubkey)}</div>

                    <div className="mb-2">
                      <div className={`text-xs ${mutedClass} mb-1`}>XandScore™</div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">{entry.score.toFixed(1)}</span>
                        <span className={`text-sm font-semibold ${color}`}>{grade}</span>
                      </div>
                    </div>

                    <div className={`flex items-center justify-between text-xs ${mutedClass} pt-3 border-t ${borderClass}`}>
                      <span>{formatUptime(entry.uptime)} uptime</span>
                      <span>{formatStorage(entry.storage)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Main Table */}
          <div className={`${cardClass} border ${borderClass} rounded-lg overflow-hidden`}>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin mb-3" />
                <p className={`text-sm ${mutedClass}`}>Loading leaderboard</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`${darkMode ? 'bg-gray-800/30' : 'bg-gray-100/50'} border-b ${borderClass}`}>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Rank</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Node</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">XandScore™</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Uptime</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Storage</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${borderClass}`}>
                    {data.slice(3).map((entry) => {
                      const { grade, color } = getScoreGrade(entry.score);
                      
                      return (
                        <tr 
                          key={entry.pubkey} 
                          onClick={() => handleNodeClick(entry.pubkey)}
                          className={`cursor-pointer transition-colors ${
                            darkMode ? 'hover:bg-gray-800/30' : 'hover:bg-gray-100/50'
                          }`}
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`font-semibold ${mutedClass}`}>#{entry.rank}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-mono text-sm">{formatPubkey(entry.pubkey)}</div>
                            <div className={`text-xs ${mutedClass} mt-0.5`}>v{entry.version}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-lg font-semibold">{entry.score.toFixed(1)}</span>
                              <span className={`text-xs font-medium ${color}`}>{grade}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Clock className={`w-3.5 h-3.5 ${mutedClass}`} />
                              <span className="text-sm">{formatUptime(entry.uptime)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <HardDrive className={`w-3.5 h-3.5 ${mutedClass}`} />
                              <span className="text-sm">{formatStorage(entry.storage)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor(entry.status)}`} />
                              <span className="text-sm capitalize">{entry.status}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <ChevronRight className={`w-4 h-4 ${mutedClass}`} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="mt-4 text-center">
            <p className={`text-xs ${mutedClass}`}>
              Auto-updates every 30 seconds
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
'use client';

import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { PNode } from '@/app/types';

interface Props {
  nodes: PNode[];
  darkMode: boolean;
  cardClass: string;
  borderClass: string;
  mutedClass: string;
  onSelectNode: (node: PNode) => void;
}

// Format uptime: seconds -> "2d 5h" or "5h 30m"
const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

// Format storage: bytes -> "1.2 TB" or "340 GB"
const formatStorage = (bytes: number): string => {
  const tb = bytes / 1_000_000_000_000;
  const gb = bytes / 1_000_000_000;
  
  if (tb >= 1) return `${tb.toFixed(1)} TB`;
  return `${gb.toFixed(0)} GB`;
};

// Format last seen: timestamp -> "2m ago" or "5h ago"
const formatLastSeen = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return `${mins}m ago`;
};

// Get region from IP using ipapi.co (free, no key needed)
const fetchRegion = async (ip: string): Promise<string> => {
  if (!ip) return 'Unknown';
  
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await res.json();
    
    // Return country code or city if available
    if (data.country_code) {
      return data.city ? `${data.city}, ${data.country_code}` : data.country_code;
    }
    return 'Unknown';
  } catch {
    return 'Unknown';
  }
};

export default function PNodesTable({
  nodes,
  darkMode,
  cardClass,
  borderClass,
  mutedClass,
  onSelectNode,
}: Props) {
  const router = useRouter();
  const [visibleCount, setVisibleCount] = useState(20);
  const [regions, setRegions] = useState<Record<string, string>>({});

  // Fetch regions for visible nodes
  useEffect(() => {
    const loadRegions = async () => {
      const newRegions: Record<string, string> = {};
      
      // Batch fetch only for nodes we don't have yet
      const nodesToFetch = visibleNodes.filter(
        node => node.ipAddress && !regions[node.ipAddress]
      );
      
      for (const node of nodesToFetch.slice(0, 5)) { // Rate limit: 5 at a time
        if (node.ipAddress) {
          newRegions[node.ipAddress] = await fetchRegion(node.ipAddress);
        }
      }
      
      if (Object.keys(newRegions).length > 0) {
        setRegions(prev => ({ ...prev, ...newRegions }));
      }
    };
    
    loadRegions();
  }, [visibleCount]); // Re-fetch when showing more nodes

  const visibleNodes = nodes.slice(0, visibleCount);
  const hasMore = visibleCount < nodes.length;

  const handleNodeClick = (node: PNode) => {
    onSelectNode(node);
    router.push(`/pnodes/${node.pubkey}`);
  };

  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + 20, nodes.length));
  };

  const showAll = () => {
    setVisibleCount(nodes.length);
  };

  return (
    <>
      {/* Desktop: Compact table */}
      <div className={`hidden md:block ${cardClass} rounded-xl border ${borderClass} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Node</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Score</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Uptime</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Last Seen</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Storage</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Region</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Ver</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-700">
              {visibleNodes.map((node) => {
                const grade = node.scoreBreakdown?.grade || 'N/A';
                const color = node.scoreBreakdown?.color || 'text-gray-400';
                const score = node.score ?? 0;
                const region = regions[node.ipAddress] || 'Loading...';

                return (
                  <tr
                    key={node.id}
                    onClick={() => handleNodeClick(node)}
                    className={`hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'} transition-colors cursor-pointer`}
                  >
                    {/* Node - compact */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-xs">{node.id}</span>
                        <span className={`text-xs ${mutedClass} font-mono`}>
                          {node.pubkey.slice(0, 8)}...
                        </span>
                      </div>
                    </td>

                    {/* Score - compact */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm">
                          {score > 0 ? score.toFixed(1) : 'N/A'}
                        </span>
                        <span className={`text-xs font-semibold ${color}`}>
                          {grade}
                        </span>
                      </div>
                    </td>

                    {/* Status - compact badge */}
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          node.status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : node.status === 'syncing'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {node.status}
                      </span>
                    </td>

                    {/* Uptime */}
                    <td className="px-4 py-3">
                      <span className="text-xs">{formatUptime(node.uptime)}</span>
                    </td>

                    {/* Last Seen */}
                    <td className="px-4 py-3">
                      <span className="text-xs">{formatLastSeen(node.lastSeen)}</span>
                    </td>

                    {/* Storage - compact */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">{formatStorage(node.storageCommitted)}</span>
                        <span className={`text-xs ${mutedClass}`}>
                          {node.storageUsagePercent.toFixed(1)}%
                        </span>
                      </div>
                    </td>

                    {/* Region */}
                    <td className="px-4 py-3">
                      <span className="text-xs">{region}</span>
                    </td>

                    {/* Version - compact */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs">{node.version}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {nodes.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className={`w-12 h-12 mx-auto mb-4 ${mutedClass}`} />
            <p className={mutedClass}>No pNodes found</p>
          </div>
        )}

        {/* Footer */}
        {nodes.length > 0 && (
          <div className={`px-6 py-4 border-t ${borderClass} text-center`}>
            <p className={`${mutedClass} mb-3 text-sm`}>
              Showing {visibleCount} of {nodes.length}
            </p>
            {hasMore && (
              <div className="flex gap-2 justify-center">
                <button
                  onClick={loadMore}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    darkMode
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  Load More (20)
                </button>
                <button
                  onClick={showAll}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    darkMode
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  Show All
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile: Card view */}
      <div className="md:hidden space-y-3">
        {visibleNodes.map((node) => {
          const grade = node.scoreBreakdown?.grade || 'N/A';
          const color = node.scoreBreakdown?.color || 'text-gray-400';
          const score = node.score ?? 0;
          const region = regions[node.ipAddress] || 'Loading...';

          return (
            <div
              key={node.id}
              onClick={() => handleNodeClick(node)}
              className={`${cardClass} rounded-lg border ${borderClass} p-4 cursor-pointer hover:${
                darkMode ? 'bg-gray-700' : 'bg-gray-50'
              } transition-colors`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-sm">{node.id}</h3>
                  <p className={`text-xs ${mutedClass} font-mono`}>
                    {node.pubkey.slice(0, 16)}...
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    node.status === 'active'
                      ? 'bg-green-500/20 text-green-400'
                      : node.status === 'syncing'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {node.status}
                </span>
              </div>

              {/* Score row */}
              <div className="flex items-center gap-4 mb-3">
                <div>
                  <p className={`text-xs ${mutedClass} mb-1`}>Score</p>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">
                      {score > 0 ? score.toFixed(1) : 'N/A'}
                    </span>
                    <span className={`text-sm font-semibold ${color}`}>{grade}</span>
                  </div>
                </div>
                <div>
                  <p className={`text-xs ${mutedClass} mb-1`}>Uptime</p>
                  <p className="font-medium text-sm">{formatUptime(node.uptime)}</p>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className={`${mutedClass} mb-1`}>Storage</p>
                  <p className="font-medium">{formatStorage(node.storageCommitted)}</p>
                  <p className={mutedClass}>{node.storageUsagePercent.toFixed(1)}%</p>
                </div>
                <div>
                  <p className={`${mutedClass} mb-1`}>Last Seen</p>
                  <p className="font-medium">{formatLastSeen(node.lastSeen)}</p>
                </div>
                <div>
                  <p className={`${mutedClass} mb-1`}>Region</p>
                  <p className="font-medium">{region}</p>
                </div>
                <div>
                  <p className={`${mutedClass} mb-1`}>Version</p>
                  <p className="font-mono font-medium">{node.version}</p>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {nodes.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className={`w-12 h-12 mx-auto mb-4 ${mutedClass}`} />
            <p className={mutedClass}>No pNodes found</p>
          </div>
        )}

        {/* Footer */}
        {nodes.length > 0 && (
          <div className="text-center py-4">
            <p className={`${mutedClass} mb-3 text-sm`}>
              Showing {visibleCount} of {nodes.length}
            </p>
            {hasMore && (
              <div className="flex flex-col gap-2">
                <button
                  onClick={loadMore}
                  className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    darkMode
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  Load More (20)
                </button>
                <button
                  onClick={showAll}
                  className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    darkMode
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  Show All
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
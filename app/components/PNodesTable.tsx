'use client';

import { AlertCircle, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { PNode } from '@/app/types';
import { useLocations } from '@/app/hooks/useLocations';

interface Props {
  nodes: PNode[];
  darkMode: boolean;
  cardClass: string;
  borderClass: string;
  mutedClass: string;
  onSelectNode: (node: PNode) => void;
  onToggleFavorite?: (node: PNode) => boolean;
  isFavorited?: (nodeId: string) => boolean;
}

// Format uptime
const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

// Format storage
const formatStorage = (bytes: number): string => {
  const tb = bytes / 1_000_000_000_000;
  const gb = bytes / 1_000_000_000;
  
  if (tb >= 1) return `${tb.toFixed(1)} TB`;
  return `${gb.toFixed(0)} GB`;
};

// Format last seen
const formatLastSeen = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return `${mins}m ago`;
};

export default function PNodesTable({
  nodes,
  darkMode,
  cardClass,
  borderClass,
  mutedClass,
  onSelectNode,
  onToggleFavorite,
  isFavorited,
}: Props) {
  const router = useRouter();
  const [visibleCount, setVisibleCount] = useState(20);

  // Extract IPs from visible nodes
  const visibleNodes = nodes.slice(0, visibleCount);
  const ips = visibleNodes.map(node => node.ipAddress).filter(Boolean) as string[];

  // Fetch locations for visible nodes
  const { getLocation } = useLocations(ips);

  const hasMore = visibleCount < nodes.length;

  const handleNodeClick = (node: PNode) => {
    onSelectNode(node);
    router.push(`/pnodes/${node.pubkey}`);
  };

  const handleFavoriteClick = (e: React.MouseEvent, node: PNode) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(node);
    }
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
                {onToggleFavorite && (
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    <Star className="w-4 h-4" />
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Node</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">XandScore™</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Uptime</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Last Seen</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Storage</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Ver</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-700">
              {visibleNodes.map((node) => {
                const grade = node.scoreBreakdown?.grade || 'N/A';
                const color = node.scoreBreakdown?.color || 'text-gray-400';
                const score = node.score ?? 0;
                const location = node.ipAddress ? getLocation(node.ipAddress) : null;

                return (
                  <tr
                    key={node.pubkey}
                    onClick={() => handleNodeClick(node)}
                    className={`hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'} transition-colors cursor-pointer`}
                  >
                    {/* Star column */}
                    {onToggleFavorite && (
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => handleFavoriteClick(e, node)}
                          className={`p-1 rounded transition-colors ${
                            darkMode ? 'hover:bg-yellow-500/20' : 'hover:bg-yellow-100'
                          }`}
                          title={
                            isFavorited?.(node.id)
                              ? 'Remove from favorites'
                              : 'Add to favorites'
                          }
                        >
                          <Star
                            className={`w-4 h-4 ${
                              isFavorited?.(node.id)
                                ? 'text-yellow-500 fill-yellow-500'
                                : mutedClass
                            }`}
                          />
                        </button>
                      </td>
                    )}

                    {/* Node - compact */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-xs">{node.id}</span>
                          {node.uptime < 86400 && (
                            <span
                              className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded uppercase"
                              title="New pNode created under 24hrs ago"
                            >
                              NEW
                            </span>
                          )}
                        </div>
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

                    {/* Location - Flag + Country */}
                    <td className="px-4 py-3">
                      {location ? (
                        <div className="flex items-center gap-2">
                          <span className="text-lg" title={location.countryName}>
                            {location.flag}
                          </span>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium">
                              {location.countryName}
                            </span>
                            {location.city && (
                              <span className={`text-xs ${mutedClass}`}>
                                {location.city}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className={`text-xs ${mutedClass}`}>--</span>
                      )}
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
          const location = node.ipAddress ? getLocation(node.ipAddress) : null;

          return (
            <div
              key={node.pubkey}
              onClick={() => handleNodeClick(node)}
              className={`${cardClass} rounded-lg border ${borderClass} p-4 cursor-pointer hover:${
                darkMode ? 'bg-gray-700' : 'bg-gray-50'
              } transition-colors relative`}
            >
              {/* Star button - top right */}
              {onToggleFavorite && (
                <button
                  onClick={(e) => handleFavoriteClick(e, node)}
                  className={`absolute top-4 right-4 p-1 rounded transition-colors ${
                    darkMode ? 'hover:bg-yellow-500/20' : 'hover:bg-yellow-100'
                  }`}
                  title={
                    isFavorited?.(node.id)
                      ? 'Remove from favorites'
                      : 'Add to favorites'
                  }
                >
                  <Star
                    className={`w-5 h-5 ${
                      isFavorited?.(node.id)
                        ? 'text-yellow-500 fill-yellow-500'
                        : mutedClass
                    }`}
                  />
                </button>
              )}

              {/* Header */}
              <div className="flex items-center justify-between mb-3 pr-8">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{node.id}</h3>
                    {node.uptime < 86400 && (
                      <span
                        className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded uppercase"
                        title="New pNode created under 24hrs ago"
                      >
                        NEW
                      </span>
                    )}
                  </div>
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
                  <p className={`text-xs ${mutedClass} mb-1`}>XandScore™</p>
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
                  <p className={`${mutedClass} mb-1`}>Location</p>
                  {location ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{location.flag}</span>
                      <p className="font-medium text-xs">{location.countryName}</p>
                    </div>
                  ) : (
                    <p className="font-medium">--</p>
                  )}
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
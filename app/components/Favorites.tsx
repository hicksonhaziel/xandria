'use client';

import { useState, useEffect } from 'react';
import { Star, X, Trash2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { PNode } from '@/app/types';

interface FavoritesProps {
  darkMode: boolean;
  onClose: () => void;
  onSelectNode: (node: PNode) => void;
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

//  cache 
const regionCache: Record<string, string> = {};

// Get region from IP - cached version
const fetchRegion = async (ip: string): Promise<string> => {
  if (!ip) return '--';
  
  // Check cache first
  if (regionCache[ip]) {
    return regionCache[ip];
  }
  
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`);
    if (!res.ok) return '--';
    
    const data = await res.json();
    
  
    if (data.countryCode) {
      regionCache[ip] = data.countryCode;
      localStorage.setItem('ip_cache', JSON.stringify(regionCache));
      return data.countryCode;
    }
    return '--';
  } catch {
    return '--';
  }
};

if (typeof window !== 'undefined') {
  const cached = localStorage.getItem('ip_cache');
  if (cached) {
    try {
      Object.assign(regionCache, JSON.parse(cached));
    } catch (e) {
      console.error('Failed to load IP cache:', e);
    }
  }
}

export const Favorites: React.FC<FavoritesProps> = ({ darkMode, onClose, onSelectNode }) => {
  const router = useRouter();
  const [favorites, setFavorites] = useState<PNode[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);
  const [regions, setRegions] = useState<Record<string, string>>({});

  const cardClass = darkMode
    ? 'bg-[#111827] bg-opacity-50 backdrop-blur-lg'
    : 'bg-white bg-opacity-70 backdrop-blur-lg';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-600';

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = () => {
    const stored = localStorage.getItem('pnode_favorites');
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse favorites:', e);
      }
    }
  };

  const removeFavorite = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const updated = favorites.filter((f) => f.id !== nodeId);
    setFavorites(updated);
    localStorage.setItem('pnode_favorites', JSON.stringify(updated));
  };

  const clearAllFavorites = () => {
    if (window.confirm('Are you sure you want to remove all favorites?')) {
      setFavorites([]);
      localStorage.removeItem('pnode_favorites');
    }
  };

  const filteredFavorites = favorites.filter(
    (node) =>
      node.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (node.pubkey && node.pubkey.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const visibleNodes = filteredFavorites.slice(0, visibleCount);
  const hasMore = visibleCount < filteredFavorites.length;

  const handleNodeClick = (node: PNode) => {
    onSelectNode(node);
    router.push(`/pnodes/${node.pubkey}`);
  };

  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + 20, filteredFavorites.length));
  };

  const showAll = () => {
    setVisibleCount(filteredFavorites.length);
  };

  // Fetch regions for visible nodes
  useEffect(() => {
    const loadRegions = async () => {
      const newRegions: Record<string, string> = {};
      
      const nodesToFetch = visibleNodes.filter(
        node => node.ipAddress && !regions[node.ipAddress]
      );
      
      for (const node of nodesToFetch.slice(0, 5)) {
        if (node.ipAddress) {
          newRegions[node.ipAddress] = await fetchRegion(node.ipAddress);
        }
      }
      
      if (Object.keys(newRegions).length > 0) {
        setRegions(prev => ({ ...prev, ...newRegions }));
      }
    };
    
    loadRegions();
  }, [visibleCount, visibleNodes, regions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`${cardClass} p-6 rounded-xl border ${borderClass}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
            <div>
              <h2 className="text-2xl font-bold">Your Favorites</h2>
              <p className={`text-sm ${mutedClass} mt-1`}>
                {favorites.length} {favorites.length === 1 ? 'node' : 'nodes'} saved
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {favorites.length > 0 && (
              <button
                onClick={clearAllFavorites}
                className={`px-3 py-2 rounded-lg border ${borderClass} ${
                  darkMode ? 'hover:bg-red-500/20' : 'hover:bg-red-50'
                } transition-colors flex items-center gap-2 text-sm`}
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              } transition-colors`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        {favorites.length > 0 && (
          <div className="mt-4">
            <input
              type="text"
              placeholder="Search favorites by ID or pubkey..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${borderClass} ${
                darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-purple-500`}
            />
          </div>
        )}
      </div>

      {/* Empty State */}
      {favorites.length === 0 ? (
        <div className={`${cardClass} rounded-xl border ${borderClass} p-16`}>
          <div className="text-center">
            <Star className={`w-20 h-20 mx-auto mb-4 ${mutedClass}`} />
            <h3 className="text-xl font-semibold mb-2">No favorites yet</h3>
            <p className={`${mutedClass} max-w-md mx-auto mb-6`}>
              Start adding nodes to your favorites by clicking the star icon on any node
              in the network view
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-white"
            >
              Browse Nodes
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop: Compact table - SAME AS PNODES TABLE */}
          <div className={`hidden md:block ${cardClass} rounded-xl border ${borderClass} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      <Star className="w-4 h-4" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Node</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">XandScore™</th>
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
                    const region = regions[node.ipAddress || ''] || '--';

                    return (
                      <tr
                        key={node.id}
                        onClick={() => handleNodeClick(node)}
                        className={`hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'} transition-colors cursor-pointer`}
                      >
                        {/* Star column */}
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => removeFavorite(e, node.id)}
                            className={`p-1 rounded transition-colors ${
                              darkMode ? 'hover:bg-red-500/20' : 'hover:bg-red-100'
                            }`}
                            title="Remove from favorites"
                          >
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          </button>
                        </td>

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

            {/* Footer */}
            {filteredFavorites.length > 0 && (
              <div className={`px-6 py-4 border-t ${borderClass} text-center`}>
                <p className={`${mutedClass} mb-3 text-sm`}>
                  Showing {visibleCount} of {filteredFavorites.length}
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

          {/* Mobile: Card view - SAME AS PNODES TABLE */}
          <div className="md:hidden space-y-3">
            {visibleNodes.map((node) => {
              const grade = node.scoreBreakdown?.grade || 'N/A';
              const color = node.scoreBreakdown?.color || 'text-gray-400';
              const score = node.score ?? 0;
              const region = regions[node.ipAddress || ''] || '--';

              return (
                <div
                  key={node.id}
                  onClick={() => handleNodeClick(node)}
                  className={`${cardClass} rounded-lg border ${borderClass} p-4 cursor-pointer hover:${
                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  } transition-colors relative`}
                >
                  {/* Star button - top right */}
                  <button
                    onClick={(e) => removeFavorite(e, node.id)}
                    className={`absolute top-4 right-4 p-1 rounded transition-colors ${
                      darkMode ? 'hover:bg-red-500/20' : 'hover:bg-red-100'
                    }`}
                    title="Remove from favorites"
                  >
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  </button>

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

            {/* Footer */}
            {filteredFavorites.length > 0 && (
              <div className="text-center py-4">
                <p className={`${mutedClass} mb-3 text-sm`}>
                  Showing {visibleCount} of {filteredFavorites.length}
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

          {/* No Results */}
          {filteredFavorites.length === 0 && searchTerm && (
            <div className={`${cardClass} rounded-xl border ${borderClass} p-8`}>
              <div className="text-center">
                <AlertCircle className={`w-12 h-12 mx-auto mb-4 ${mutedClass}`} />
                <p className={mutedClass}>No favorites match "{searchTerm}"</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
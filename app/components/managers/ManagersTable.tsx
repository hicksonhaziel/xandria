'use client';

import { AlertCircle, ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface Manager {
  address: string;
  nodes: any[];
  totalNodes: number;
  devnetNodes: number;
  mainnetNodes: number;
  activeNodes: number;
  lastRegistered: string;
}

interface Props {
  managers: Manager[];
  darkMode: boolean;
  cardClass: string;
  borderClass: string;
  mutedClass: string;
  onSelectManager: (manager: Manager) => void;
}

const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  } catch {
    return 'Unknown';
  }
};

export default function ManagersTable({
  managers,
  darkMode,
  cardClass,
  borderClass,
  mutedClass,
  onSelectManager,
}: Props) {
  const [visibleCount, setVisibleCount] = useState(20);
  const visibleManagers = managers.slice(0, visibleCount);
  const hasMore = visibleCount < managers.length;

  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + 20, managers.length));
  };

  const showAll = () => {
    setVisibleCount(managers.length);
  };

  return (
    <>
      {/* Desktop Table */}
      <div className={`hidden md:block ${cardClass} rounded-xl border ${borderClass} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Manager Address
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Total Nodes
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Active Nodes
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Networks
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Last Registered
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {visibleManagers.map((manager) => (
                <tr
                  key={manager.address}
                  onClick={() => onSelectManager(manager)}
                  className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors cursor-pointer`}
                >
                  {/* Manager Address */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-mono text-xs font-medium">
                        {manager.address.slice(0, 8)}...{manager.address.slice(-6)}
                      </span>
                      <span className={`text-xs ${mutedClass}`}>
                        {manager.totalNodes} node{manager.totalNodes !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </td>

                  {/* Total Nodes */}
                  <td className="px-4 py-3">
                    <span className="font-bold text-lg">{manager.totalNodes}</span>
                  </td>

                  {/* Active Nodes */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-green-400">
                        {manager.activeNodes}
                      </span>
                      <span className={`text-xs ${mutedClass}`}>
                        ({((manager.activeNodes / manager.totalNodes) * 100).toFixed(0)}%)
                      </span>
                    </div>
                  </td>

                  {/* Networks */}
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {manager.devnetNodes > 0 && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-medium rounded">
                          Devnet ({manager.devnetNodes})
                        </span>
                      )}
                      {manager.mainnetNodes > 0 && (
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-medium rounded">
                          Mainnet ({manager.mainnetNodes})
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Last Registered */}
                  <td className="px-4 py-3">
                    <span className="text-xs">{formatDate(manager.lastRegistered)}</span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectManager(manager);
                      }}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        darkMode
                          ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                          : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      }`}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {managers.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className={`w-12 h-12 mx-auto mb-4 ${mutedClass}`} />
            <p className={mutedClass}>No managers found</p>
          </div>
        )}

        {/* Footer */}
        {managers.length > 0 && (
          <div className={`px-6 py-4 border-t ${borderClass} text-center`}>
            <p className={`${mutedClass} mb-3 text-sm`}>
              Showing {visibleCount} of {managers.length}
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

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {visibleManagers.map((manager) => (
          <div
            key={manager.address}
            onClick={() => onSelectManager(manager)}
            className={`${cardClass} rounded-lg border ${borderClass} p-4 cursor-pointer ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
            } transition-colors`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="font-mono text-xs font-medium mb-1 break-all">
                  {manager.address}
                </div>
                <div className={`text-xs ${mutedClass}`}>
                  {manager.totalNodes} node{manager.totalNodes !== 1 ? 's' : ''} registered
                </div>
              </div>
              <ExternalLink className={`w-4 h-4 ${mutedClass} flex-shrink-0 ml-2`} />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className={`text-xs ${mutedClass} mb-1`}>Total Nodes</p>
                <p className="text-xl font-bold">{manager.totalNodes}</p>
              </div>
              <div>
                <p className={`text-xs ${mutedClass} mb-1`}>Active</p>
                <p className="text-xl font-bold text-green-400">
                  {manager.activeNodes}
                </p>
              </div>
            </div>

            {/* Networks */}
            <div className="mb-3">
              <p className={`text-xs ${mutedClass} mb-2`}>Networks</p>
              <div className="flex flex-wrap gap-1.5">
                {manager.devnetNodes > 0 && (
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-medium rounded">
                    Devnet ({manager.devnetNodes})
                  </span>
                )}
                {manager.mainnetNodes > 0 && (
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-medium rounded">
                    Mainnet ({manager.mainnetNodes})
                  </span>
                )}
              </div>
            </div>

            {/* Last Registered */}
            <div className="flex items-center justify-between">
              <span className={`text-xs ${mutedClass}`}>Last registered</span>
              <span className="text-xs font-medium">
                {formatDate(manager.lastRegistered)}
              </span>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {managers.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className={`w-12 h-12 mx-auto mb-4 ${mutedClass}`} />
            <p className={mutedClass}>No managers found</p>
          </div>
        )}

        {/* Footer */}
        {managers.length > 0 && (
          <div className="text-center py-4">
            <p className={`${mutedClass} mb-3 text-sm`}>
              Showing {visibleCount} of {managers.length}
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
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import type { PNode } from '@/app/types';
import { exportPNodesCSV } from '@/app/lib/utils/exportPNodes';
import { Suspense } from 'react';
import { usePNodes, useFilteredPNodes } from '@/app/hooks';
import { useAppContext } from '@/app/context/AppContext';
import dynamic from 'next/dynamic';
import Header from '@/app/components/Header';
import Sidebar from '@/app/components/Sidebar';
import Footer from '@/app/components/Footer';
import NetworkCharts from './components/NetworkCharts';
import { TopologySkeleton } from './components/skeletons/TopologySkeleton';
import NetworkOverviewStats from './components/NetworkOverviewStats';
import SearchAndFilters from './components/SearchAndFilters';
import PNodesTable from './components/PNodesTable';
import { Favorites } from './components/Favorites';
import { useSidebarCollapse } from '@/app/hooks/useSidebarCollapse';
import { AlertCircle, Check, Star } from 'lucide-react';

const NetworkTopology3D = dynamic(
  () => import('@/app/components/NetworkTopology3D'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[600px] bg-gray-900 rounded-xl flex items-center justify-center">
        <div className="text-gray-400">Loading 3D visualization...</div>
      </div>
    )
  }
);

const vtoggleOptions = [
  { key: 'pNodes_Explore' as const, label: 'pNodes Explore' },
  { key: 'Network_3D' as const, label: 'Network 3D' },
  { key: 'pNodes_Analysis' as const, label: 'pNodes Analysis' }
];

const XandViz = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sidebarCollapsed = useSidebarCollapse();
  
  const {
    darkMode,
    visualStatus,
    setVisualStatus,
    pnodesState,
    setPnodesState,
  } = useAppContext();

  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState<PNode[]>([]);

  const [searchTerm, setSearchTerm] = useState(pnodesState.searchTerm);
  const [filterStatus, setFilterStatus] = useState(pnodesState.filterStatus);
  const [sortBy, setSortBy] = useState(pnodesState.sortBy);
  const [selectedNode, setSelectedNode] = useState<PNode | null>(pnodesState.selectedNode);

  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'favorites') {
        setShowFavorites(true);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('pnode_favorites');
      if (stored) {
        try {
          setFavorites(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse favorites:', e);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const params = new URLSearchParams(window.location.search);
    
    if (showFavorites) {
      params.set('view', 'favorites');
    } else {
      params.delete('view');
    }
    
    const newUrl = params.toString() 
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    
    window.history.pushState({}, '', newUrl);
  }, [showFavorites]);

  const toggleFavorite = (node: PNode) => {
    if (typeof window === 'undefined') return false;
    
    const stored = localStorage.getItem('pnode_favorites');
    let currentFavorites: PNode[] = [];
    
    if (stored) {
      try {
        currentFavorites = JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse favorites:', e);
      }
    }

    const isFavorited = currentFavorites.some(f => f.id === node.id);
    
    let updated: PNode[];
    if (isFavorited) {
      updated = currentFavorites.filter(f => f.id !== node.id);
    } else {
      updated = [...currentFavorites, node];
    }
    
    localStorage.setItem('pnode_favorites', JSON.stringify(updated));
    setFavorites(updated);
    
    return !isFavorited;
  };

  const isFavorited = (nodeId: string) => {
    return favorites.some(f => f.id === nodeId);
  };

  useEffect(() => {
    if (pnodesState.scrollPosition > 0 && !showFavorites) {
      setTimeout(() => {
        window.scrollTo(0, pnodesState.scrollPosition);
      }, 100);
    }
  }, [pnodesState.scrollPosition, showFavorites]);

  useEffect(() => {
    const saveState = () => {
      setPnodesState({
        searchTerm,
        filterStatus,
        sortBy,
        selectedNode,
        scrollPosition: window.scrollY,
      });
    };

    return saveState;
  }, [searchTerm, filterStatus, sortBy, selectedNode, setPnodesState]);

  useEffect(() => {
    const handleScroll = () => {
      setPnodesState(prev => ({
        ...prev,
        scrollPosition: window.scrollY,
      }));
    };

    let timeoutId: NodeJS.Timeout;
    const throttledScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 200);
    };

    window.addEventListener('scroll', throttledScroll);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', throttledScroll);
    };
  }, [setPnodesState]);

  const { pNodes, loading, error } = usePNodes();

  const filteredNodes = useFilteredPNodes(
    pNodes,
    searchTerm,
    filterStatus,
    sortBy
  );

  const networkStats = useMemo(() => {
    if (pNodes.length === 0) {
      return {
        total: 0,
        active: 0,
        avgScore: '0.0',
        totalStorage: '0',
        usedStorage: '0',
        utilization: '0.0'
      };
    }
    
    const active = pNodes.filter(n => n.status === 'active').length;
    const avgScore = pNodes.reduce((sum, n) => sum + (n.score || 0), 0) / pNodes.length;
    
    const totalStorageBytes = pNodes.reduce((sum, n) => sum + n.storageCommitted, 0);
    const usedStorageBytes = pNodes.reduce((sum, n) => sum + n.storageUsed, 0);
    
    const totalStorageGB = totalStorageBytes / (1024 * 1024 * 1024);
    const usedStorageGB = usedStorageBytes / (1024 * 1024 * 1024);
    
    const formatStorage = (gb: number) => {
      if (gb >= 1000000) {
        return `${(gb / 1000000).toFixed(2)} PB`;
      } else if (gb >= 1000) {
        return `${(gb / 1000).toFixed(2)} TB`;
      } else if (gb >= 1) {
        return `${gb.toFixed(2)} GB`;
      } else {
        return `${(gb * 1024).toFixed(2)} MB`;
      }
    };
    
    return {
      total: pNodes.length,
      active,
      avgScore: avgScore.toFixed(1),
      totalStorage: formatStorage(totalStorageGB),
      usedStorage: formatStorage(usedStorageGB),
      utilization: totalStorageGB > 0 ? ((usedStorageGB / totalStorageGB) * 100).toFixed(1) : '0.0'
    };
  }, [pNodes]);

  const versionDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    pNodes.forEach(node => {
      dist[node.version] = (dist[node.version] || 0) + 1;
    });
    return Object.entries(dist).map(([version, count]) => ({ version, count }));
  }, [pNodes]);

  const statusDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    pNodes.forEach(node => {
      dist[node.status] = (dist[node.status] || 0) + 1;
    });
    return Object.entries(dist).map(([status, count]) => ({ 
      status: status.charAt(0).toUpperCase() + status.slice(1), 
      count 
    }));
  }, [pNodes]);

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

  const bgClass = darkMode ? 'bg-[#0B0F14]' : 'bg-gray-50';
  const cardClass = darkMode ? 'bg-[#111827] bg-opacity-50 backdrop-blur-lg' : 'bg-white bg-opacity-70 backdrop-blur-lg';
  const textClass = darkMode ? 'text-gray-100' : 'text-gray-900';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-600';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';

  const exportData = () => exportPNodesCSV(filteredNodes);

  if (error) {
    return (
      <div className={`min-h-screen ${bgClass} ${textClass} flex items-center justify-center`}>
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Data</h2>
          <p className={mutedClass}>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`min-h-screen ${bgClass} ${textClass} transition-colors duration-300`}>
      <Header />
      <Sidebar />

      <div 
        className={`
          pt-20 px-6 transition-all duration-300
          ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}
        `}
      >
        <div className="container mx-auto px-4 py-8">
          {showFavorites ? (
            <Favorites 
              darkMode={darkMode} 
              onClose={() => setShowFavorites(false)}
              onSelectNode={setSelectedNode}
            />
          ) : (
            <>
              <NetworkOverviewStats
                loading={loading}
                networkStats={networkStats}
                cardClass={cardClass}
                borderClass={borderClass}
                mutedClass={mutedClass}
              />

              <SearchAndFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                sortBy={sortBy}
                setSortBy={setSortBy}
                exportData={exportData}
                darkMode={darkMode}
                cardClass={cardClass}
                borderClass={borderClass}
                mutedClass={mutedClass}
              />

              <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                <div className=""></div>

                <button
                  onClick={() => setShowFavorites(true)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${borderClass} ${cardClass} hover:shadow-md transition-all`}
                >
                  <Star className={`w-4 h-4 ${favorites.length > 0 ? 'text-yellow-500 fill-yellow-500' : mutedClass}`} />
                  <span className="text-sm font-medium">Favorites</span>
                  {favorites.length > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                      {favorites.length}
                    </span>
                  )}
                </button>
              </div>

              {visualStatus === 'Network_3D' && (
                <Suspense fallback={<TopologySkeleton />}>
                  <div className={`${cardClass} p-4 rounded-xl border ${borderClass} mb-8`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">3D Network Topology</h3>
                    </div>

                    <NetworkTopology3D
                      nodes={pNodes}
                      onNodeSelect={(node) => setSelectedNode(node)}
                    />
                  </div>
                </Suspense>
              )}
            
              {visualStatus === 'pNodes_Analysis' && 
                <NetworkCharts
                  versionDistribution={versionDistribution}
                  statusDistribution={statusDistribution}
                  darkMode={darkMode}
                  cardClass={cardClass}
                  borderClass={borderClass}
                  mutedClass={mutedClass}
                  COLORS={COLORS}
                />
              }

              {visualStatus === 'pNodes_Explore' && (
                <PNodesTable
                  nodes={filteredNodes}
                  darkMode={darkMode}
                  cardClass={cardClass}
                  borderClass={borderClass}
                  mutedClass={mutedClass}
                  onSelectNode={setSelectedNode}
                  onToggleFavorite={toggleFavorite}
                  isFavorited={isFavorited}
                />
              )}
            </>
          )}
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default XandViz;
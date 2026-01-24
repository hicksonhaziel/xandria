'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { Star, WifiOff } from 'lucide-react';

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

const Xandria = () => {
  const {
    darkMode,
    visualStatus,
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

  const bgClass = darkMode ? 'bg-[#0B0F14]' : 'bg-gray-50';
  const cardClass = darkMode ? 'bg-[#111827] bg-opacity-50 backdrop-blur-lg' : 'bg-white bg-opacity-70 backdrop-blur-lg';
  const textClass = darkMode ? 'text-gray-100' : 'text-gray-900';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-600';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';

  const exportData = () => exportPNodesCSV(filteredNodes);

  const getHeroText = () => {
    switch (visualStatus) {
      case 'pNodes_Explore':
        return 'Xandria pNodes Explorer';
      case 'pNodes_Analysis':
        return 'Xandria pNodes Analytics';
      case 'Network_3D':
        return 'Xandria pNodes Network 3D';
      default:
        return 'Xandria pNodes Explorer';
    }
  };

  if (error) {
    return (
      <div className={`min-h-screen ${bgClass} ${textClass} flex items-center justify-center`}>
        <div className="text-center max-w-md mx-auto px-4">
          <WifiOff className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Connection Error</h2>
          <p className={`${mutedClass} mb-4`}>
            Unable to load network data. Please check your internet connection and try again.
          </p>
          <div className={`${cardClass} border ${borderClass} rounded-lg p-4 mb-6`}>
            <p className="text-sm text-red-400">{error}</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors font-medium"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} ${textClass} transition-colors duration-300 overflow-x-hidden`}>
      <Header />
      <Sidebar />

      <div 
        className={`
          pt-20 pb-24 lg:pb-8 px-4 sm:px-6 
          transition-all duration-300
          lg:ml-64
          min-h-screen
        `}
      >
        <div className="container mx-auto max-w-7xl py-8">
          {showFavorites ? (
            <Favorites 
              darkMode={darkMode} 
              onClose={() => setShowFavorites(false)}
              onSelectNode={setSelectedNode}
            />
          ) : (
            <>
              {/* Hero Section */}
              <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                  {getHeroText()}
                </h1>
                <p className={`text-sm md:text-base ${mutedClass} max-w-2xl`}>
                  Discover and analyze your Xandeum pNodes with powerful search and filtering tools
                </p>
              </div>
              
              <NetworkOverviewStats
                loading={loading}
                networkStats={networkStats}
                cardClass={cardClass}
                borderClass={borderClass}
                mutedClass={mutedClass}
              />

              {visualStatus === 'pNodes_Explore' && (
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
              )}

              {visualStatus === 'pNodes_Explore' && (
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
              )}

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
            
              {visualStatus === 'pNodes_Analysis' && (
                <div>
                  <NetworkCharts
                    pNodes={pNodes}
                    darkMode={darkMode}
                    cardClass={cardClass}
                    borderClass={borderClass}
                    mutedClass={mutedClass}
                  />
                </div>
              )}

              {visualStatus === 'pNodes_Explore' && (
                loading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                      <p className={mutedClass}>Loading pnodes...</p>
                    </div>
                  </div>
                ) : (
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
                )
              )}
            </>
          )}
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default Xandria;
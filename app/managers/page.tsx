'use client';

import { useState, useEffect } from 'react';
import { useAppContext } from '@/app/context/AppContext';
import Header from '@/app/components/Header';
import Sidebar from '@/app/components/Sidebar';
import ManagersOverviewStats from '@/app/components/managers/ManagersOverviewStats';
import ManagersSearchAndFilters from '@/app/components/managers/SearchAndFilters';
import ManagersTable from '@/app/components/managers/ManagersTable';
import ManagerModal from '@/app/components/managers/ManagerModal';

interface Manager {
  address: string;
  nodes: any[];
  totalNodes: number;
  devnetNodes: number;
  mainnetNodes: number;
  activeNodes: number;
  lastRegistered: string;
}

interface ManagerStats {
  totalManagers: number;
  totalNodes: number;
  devnetNodes: number;
  mainnetNodes: number;
  activeNodes: number;
}

const Managers = () => {
  const { darkMode } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [allNodes, setAllNodes] = useState<any[]>([]);
  const [stats, setStats] = useState<ManagerStats | null>(null);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterNetwork, setFilterNetwork] = useState('all');
  const [sortBy, setSortBy] = useState('nodes');

  const bgClass = darkMode ? 'bg-[#0B0F14]' : 'bg-gray-50';
  const cardClass = darkMode 
    ? 'bg-[#111827] bg-opacity-50 backdrop-blur-lg' 
    : 'bg-white bg-opacity-70 backdrop-blur-lg';
  const textClass = darkMode ? 'text-gray-100' : 'text-gray-900';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-600';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';

  useEffect(() => {
    fetchManagers();
  }, []);

  const fetchManagers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/managers');
      const data = await response.json();
      
      if (data.success) {
        setManagers(data.data);
        setStats(data.stats);
        setAllNodes(data.allNodes);
      }
    } catch (error) {
      console.error('Error fetching managers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort managers
  const filteredManagers = managers
    .filter((manager) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        manager.address.toLowerCase().includes(searchLower) ||
        manager.nodes.some(n => n.pubkey.toLowerCase().includes(searchLower));

      if (!matchesSearch) return false;

      // Network filter
      if (filterNetwork === 'devnet') {
        return manager.devnetNodes > 0;
      } else if (filterNetwork === 'mainnet') {
        return manager.mainnetNodes > 0;
      } else if (filterNetwork === 'both') {
        return manager.devnetNodes > 0 && manager.mainnetNodes > 0;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'nodes':
          return b.totalNodes - a.totalNodes;
        case 'active':
          return b.activeNodes - a.activeNodes;
        case 'recent':
          return new Date(b.lastRegistered).getTime() - new Date(a.lastRegistered).getTime();
        default:
          return 0;
      }
    });

  const exportData = () => {
    const csv = [
      ['Manager Address', 'Total Nodes', 'Active Nodes', 'Devnet Nodes', 'Mainnet Nodes', 'Last Registered'],
      ...filteredManagers.map(m => [
        m.address,
        m.totalNodes,
        m.activeNodes,
        m.devnetNodes,
        m.mainnetNodes,
        m.lastRegistered,
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xandeum-managers-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className={`min-h-screen ${bgClass} ${textClass} transition-colors duration-300`}>
      <Header />
      <Sidebar />

      <div className="pt-20 pb-24 lg:pb-8 px-4 sm:px-6 lg:ml-64 min-h-screen">
        <div className="container mx-auto px-4 md:px-0.5 sm:px-0.5 py-8">
          {/* Hero Section */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-2xl font-bold mb-2">
              pNodes Managers
            </h1>
            <p className={`text-sm md:text-base ${mutedClass} max-w-2xl`}>
              Discover Xandeum pNodes Managers with powerful search and filtering tools
            </p>
          </div>

          {/* Stats */}
          <ManagersOverviewStats
            loading={loading}
            stats={stats}
            cardClass={cardClass}
            borderClass={borderClass}
            mutedClass={mutedClass}
          />

          {/* Search and Filters */}
          <ManagersSearchAndFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterNetwork={filterNetwork}
            setFilterNetwork={setFilterNetwork}
            sortBy={sortBy}
            setSortBy={setSortBy}
            exportData={exportData}
            darkMode={darkMode}
            borderClass={borderClass}
            mutedClass={mutedClass}
          />

          {/* Results Count */}
          {!loading && (
            <div className="mb-4">
              <p className={`text-sm ${mutedClass}`}>
                {filteredManagers.length === managers.length
                  ? `Showing all ${managers.length} managers`
                  : `Showing ${filteredManagers.length} of ${managers.length} managers`}
              </p>
            </div>
          )}

          {/* Managers Table */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                <p className={mutedClass}>Loading managers...</p>
              </div>
            </div>
          ) : (
            <ManagersTable
              managers={filteredManagers}
              darkMode={darkMode}
              cardClass={cardClass}
              borderClass={borderClass}
              mutedClass={mutedClass}
              onSelectManager={setSelectedManager}
            />
          )}
        </div>
      </div>

      {/* Manager Modal */}
      {selectedManager && (
        <ManagerModal
          manager={selectedManager}
          allNodes={allNodes}
          onClose={() => setSelectedManager(null)}
          darkMode={darkMode}
          cardClass={cardClass}
          borderClass={borderClass}
          mutedClass={mutedClass}
        />
      )}
    </div>
  );
};

export default Managers;
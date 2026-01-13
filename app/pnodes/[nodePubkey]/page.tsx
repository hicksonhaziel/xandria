'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';
import { usePNodeInfo } from '@/app/hooks/usePNodeInfo';
import Header from '@/app/components/Header';
import Sidebar from '@/app/components/Sidebar';
import Footer from '@/app/components/Footer';
import PNodeHeader from '@/app/components/pnode/PNodeHeader';
import PNodeStatsGrid from '@/app/components/pnode/PNodeStatsGrid';
import Recommendations from '@/app/components/pnode/Recommendations';
import PNodeCharts from '@/app/components/pnode/PNodeCharts';
import LiveUpdateIndicator from '@/app/components/pnode/LiveUpdateIndicator';
import Metrics from '@/app/components/pnode/Metrics';
import { useSidebarCollapse } from '@/app/hooks/useSidebarCollapse';
import { Loader2, AlertCircle } from 'lucide-react';

export default function PNodeDetailPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sidebarCollapsed = useSidebarCollapse();
    
  const params = useParams();
  const nodePubkey = params.nodePubkey as string;

  const {
    darkMode, 
    setDarkMode, 
    visualStatus,
    setVisualStatus,
  } = useAppContext();

  // State to track which network this node belongs to
  const [nodeNetwork, setNodeNetwork] = useState<'devnet' | 'mainnet'>('devnet');
  const [networkLoading, setNetworkLoading] = useState(true);

  // Determine node's network on mount
  useEffect(() => {
    async function detectNetwork() {
      try {
        setNetworkLoading(true);
        
        // Check mainnet first
        const mainnetRes = await fetch('/api/pods-credits?network=mainnet');
        const mainnetData = await mainnetRes.json();
        
        const isMainnet = mainnetData.pods_credits?.some(
          (pod: any) => pod.pod_id === nodePubkey
        );
        
        if (isMainnet) {
          setNodeNetwork('mainnet');
        } else {
          setNodeNetwork('devnet');
        }
      } catch (error) {
        console.error('Failed to detect network:', error);
        // Default to devnet on error
        setNodeNetwork('devnet');
      } finally {
        setNetworkLoading(false);
      }
    }

    if (nodePubkey) {
      detectNetwork();
    }
  }, [nodePubkey]);

  const { data, loading, refreshing, error, lastUpdate, refresh } = usePNodeInfo(
    nodePubkey,
    { refreshInterval: 30000, autoRefresh: true }
  );

  const bgClass = darkMode ? 'bg-[#0B0F14]' : 'bg-gray-50';
  const textClass = darkMode ? 'text-gray-100' : 'text-gray-900';

  return (
    <div ref={containerRef} className={`min-h-screen ${bgClass} ${textClass} transition-colors duration-300`}>
      
      <Header />
      <Sidebar />
      
      <div 
        className={`
          pt-20 px-6 transition-all duration-300
          ml-[4.5rem] lg:ml-64
        `}
      >
        <div className="container mx-auto px-4 md:px-0.5 sm:px-0.5 py-8">
        
          {/* Loading state */}
          {(loading || networkLoading) && (
            <div className="flex flex-col items-center justify-center py-20 mb-64">
              <Loader2 className="w-12 h-12 animate-spin text-purple-400 mb-4" />
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                Loading pNode information...
              </p>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className={`${darkMode ? 'bg-red-900/20' : 'bg-red-100'} border ${
              darkMode ? 'border-red-800' : 'border-red-300'
            } rounded-lg p-6 text-center`}>
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-bold mb-2">Error Loading pNode</h2>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                {error}
              </p>
            </div>
          )}

          {/* Data display */}
          {data && !networkLoading && (
            <>
              <PNodeHeader node={data} darkMode={darkMode} />
              
              {/* Network badge */}
              <div className="mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  nodeNetwork === 'mainnet' 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}>
                  {nodeNetwork === 'mainnet' ? '🟢 Mainnet' : '🔵 Devnet'}
                </span>
              </div>
              
              <LiveUpdateIndicator 
                lastUpdate={lastUpdate}
                refreshing={refreshing} 
                onRefresh={refresh}
                darkMode={darkMode}
              />
              
              <PNodeStatsGrid node={data} darkMode={darkMode} network={nodeNetwork} />
              
              <PNodeCharts node={data} darkMode={darkMode} network={nodeNetwork} />
              
              <Metrics
                darkMode={darkMode}
                nodePubkey={nodePubkey}
                details={data.details}
                network={nodeNetwork}
              />

              <Recommendations 
                recommendations={data.recommendations} 
                darkMode={darkMode} 
                nodeData={data}
              />
            </>
          )}

        </div>
        <Footer/>
      </div>
    </div>
  );
}
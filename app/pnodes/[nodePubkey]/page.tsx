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


  // Fetch with auto-refresh every 30 seconds
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
          ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}
        `}
      >
      <div className="container mx-auto px-4 py-8">
        
        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              Loading pNode information...
            </p>
          </div>
        )}

        {/* Error state */}
        {error && (
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
        {data && (
          <>
            <PNodeHeader node={data} darkMode={darkMode} />
            
            {/* Live update indicator */}
            <LiveUpdateIndicator
              lastUpdate={lastUpdate}
              refreshing={refreshing} 
              onRefresh={refresh}
              darkMode={darkMode}
            />
            
            <PNodeStatsGrid node={data} darkMode={darkMode} />
            
            {/* Charts */}
            <PNodeCharts node={data} darkMode={darkMode} />
            
            {/* Credits and Metrics section - Pass nodePubkey */}
            <Metrics
              darkMode={darkMode}
              nodePubkey={nodePubkey}
              details={data.details} 
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
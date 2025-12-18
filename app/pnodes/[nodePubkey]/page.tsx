'use client';

import { useParams } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';
import { usePNodeInfo } from '@/app/hooks/usePNodeInfo';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import PNodeHeader from '@/app/components/pnode/PNodeHeader';
import PNodeStatsGrid from '@/app/components/pnode/PNodeStatsGrid';
import ScoreBreakdown from '@/app/components/pnode/ScoreBreakdown';
import AdvancedMetrics from '@/app/components/pnode/AdvancedMetrics';
import NetworkComparison from '@/app/components/pnode/NetworkComparison';
import Recommendations from '@/app/components/pnode/Recommendations';
import PNodeCharts from '@/app/components/pnode/PNodeCharts';
import PNodeCredits from '@/app/components/pnode/PNodeCredits';
import LiveUpdateIndicator from '@/app/components/pnode/LiveUpdateIndicator';
import { Loader2, AlertCircle } from 'lucide-react';

export default function PNodeDetailPage() {
  const params = useParams();
  const nodePubkey = params.nodePubkey as string;

  const {
    darkMode,
    setDarkMode,
    show3DView,
    setShow3DView,
    visualStatus,
    setVisualStatus,
  } = useAppContext();

  // Fetch with auto-refresh every 30 seconds
  const { data, loading, refreshing, error, lastUpdate, refresh } = usePNodeInfo(
    nodePubkey,
    { refreshInterval: 30000, autoRefresh: true }
  );

  const bgClass = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const textClass = darkMode ? 'text-gray-100' : 'text-gray-900';

  return (
    <div className={`min-h-screen ${bgClass} ${textClass} transition-colors duration-300`}>
      
      <div className="text-inherit">
        <Header 
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          show3DView={show3DView}
          visualStatus={visualStatus}
          setShow3DView={setShow3DView}
          setVisualStatus={setVisualStatus}
        />
      </div>
      
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
            
            {/* Credits section */}
            <PNodeCredits darkMode={darkMode} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ScoreBreakdown node={data} darkMode={darkMode} />
              
              <NetworkComparison 
                comparison={data.networkComparison} 
                darkMode={darkMode} 
              />
            </div>

            <AdvancedMetrics 
              details={data.details} 
              darkMode={darkMode} 
            />

            <Recommendations 
              recommendations={data.recommendations} 
              darkMode={darkMode} 
            />
          </>
        )}

      </div>

      <Footer darkMode={darkMode} />
    </div>
  );
}
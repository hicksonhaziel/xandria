'use client';

import { useMemo } from 'react';
import { useAppContext } from '@/app/context/AppContext';
import { usePNodes } from '@/app/hooks';
import { useLocations } from '@/app/hooks/useLocations';
import Header from '@/app/components/Header';
import Sidebar from '@/app/components/Sidebar';
import Footer from '@/app/components/Footer';
import { 
  Globe2, 
  MapPin, 
  Database, 
  PieChart as PieChartIcon,
  Loader2,
  TrendingUp,
  HardDrive
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import dynamic from 'next/dynamic';

const COLORS = ['#8b5cf6', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#06b6d4'];

export default function AnalyticsPage() {
  const { darkMode } = useAppContext();
  const { pNodes, loading } = usePNodes();

  // Extract IPs from pNodes
  const nodeIps = useMemo(() => pNodes.map(node => node.ipAddress), [pNodes]);
  
  // Fetch locations for all nodes
  const { locations, loading: locationsLoading } = useLocations(nodeIps);

  const bgClass = darkMode ? 'bg-[#0B0F14]' : 'bg-gray-50';
  const cardClass = darkMode 
    ? 'bg-[#111827] bg-opacity-50 backdrop-blur-lg' 
    : 'bg-white bg-opacity-70 backdrop-blur-lg';
  const textClass = darkMode ? 'text-gray-100' : 'text-gray-900';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-600';
  const borderClass = darkMode ? 'border-gray-800' : 'border-gray-200';

  // Country distribution
  const countryDistribution = useMemo(() => {
    const countryCount: Record<string, { count: number; flag: string }> = {};
    
    pNodes.forEach(node => {
      const location = locations.get(node.ipAddress);
      if (location) {
        const country = location.countryName || 'Unknown';
        if (!countryCount[country]) {
          countryCount[country] = { count: 0, flag: location.flag };
        }
        countryCount[country].count++;
      }
    });

    return Object.entries(countryCount)
      .map(([country, data]) => ({ country, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [pNodes, locations]);

  // Status distribution
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

  // Storage analytics
  const storageAnalytics = useMemo(() => {
    const totalCommitted = pNodes.reduce((sum, n) => sum + n.storageCommitted, 0);
    const totalUsed = pNodes.reduce((sum, n) => sum + n.storageUsed, 0);
    const totalFree = totalCommitted - totalUsed;
    
    const usedPercent = totalCommitted > 0 ? (totalUsed / totalCommitted) * 100 : 0;
    const freePercent = 100 - usedPercent;

    return {
      data: [
        { name: 'Used', value: totalUsed, fill: '#8b5cf6' },
        { name: 'Free', value: totalFree, fill: '#10b981' },
      ],
      usedPercent: usedPercent.toFixed(1),
      freePercent: freePercent.toFixed(1),
      totalGB: (totalCommitted / (1024 ** 3)).toFixed(2),
      usedGB: (totalUsed / (1024 ** 3)).toFixed(2),
      freeGB: (totalFree / (1024 ** 3)).toFixed(2),
    };
  }, [pNodes]);

  // Status summary for note
  const statusSummary = useMemo(() => {
    const total = pNodes.length;
    const active = pNodes.filter(n => n.status === 'active').length;
    const activePercent = total > 0 ? ((active / total) * 100).toFixed(1) : '0';
    return { total, active, activePercent };
  }, [pNodes]);

  if (loading) {
    return (
      <div className={`min-h-screen ${bgClass} ${textClass}`}>
        <Header />
        <Sidebar />
        <div className="ml-[4.5rem] lg:ml-64 pt-20 px-6 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
            <p className={mutedClass}>Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    
      <div className=" pt-20 px-6 transition-all duration-200">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-1">Network Analytics</h1>
            <p className={`${mutedClass} text-sm`}>
              Geographic distribution and network insights
            </p>
          </div>

          {/* Top Row - Globe and Countries */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            
            {/* Globe Visualization */}
            <div className={`${cardClass} border ${borderClass} rounded-lg p-4`}>
              <div className="flex items-center gap-2 mb-3">
                <Globe2 className={`w-5 h-5 ${mutedClass}`} />
                <h3 className="text-lg font-semibold">Global Distribution</h3>
              </div>
              
              {/* Placeholder for Globe - Replace with actual globe component */}
              <div className="w-full h-[350px] rounded-lg bg-gradient-to-br from-purple-900/20 to-blue-900/20 flex items-center justify-center border border-gray-800">
                <div className="text-center">
                  <Globe2 className={`w-16 h-16 ${mutedClass} mx-auto mb-2`} />
                  <p className={`text-sm ${mutedClass}`}>
                    {pNodes.length} nodes across {countryDistribution.length} countries
                  </p>
                </div>
              </div>
              
              <p className={`text-xs ${mutedClass} mt-3`}>
                Network spans {countryDistribution.length} countries with nodes distributed globally
              </p>
            </div>

            {/* Top Countries */}
            <div className={`${cardClass} border ${borderClass} rounded-lg p-4`}>
              <div className="flex items-center gap-2 mb-3">
                <MapPin className={`w-5 h-5 ${mutedClass}`} />
                <h3 className="text-lg font-semibold">Top Countries</h3>
              </div>
              
              <div className="space-y-2 h-[350px] overflow-y-auto">
                {countryDistribution.map((country, idx) => {
                  const percentage = ((country.count / pNodes.length) * 100).toFixed(1);
                  return (
                    <div 
                      key={country.country}
                      className={`flex items-center justify-between p-2 rounded-lg ${
                        darkMode ? 'bg-gray-800/30' : 'bg-gray-100/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-bold ${mutedClass}`}>#{idx + 1}</span>
                        <span className="text-2xl">{country.flag}</span>
                        <span className="font-medium">{country.country}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{country.count}</div>
                        <div className={`text-xs ${mutedClass}`}>{percentage}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className={`text-xs ${mutedClass} mt-3`}>
                Top country hosts {countryDistribution[0]?.count || 0} nodes ({((countryDistribution[0]?.count || 0) / pNodes.length * 100).toFixed(1)}% of network)
              </p>
            </div>
          </div>

          {/* Bottom Row - Storage and Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Storage Distribution */}
            <div className={`${cardClass} border ${borderClass} rounded-lg p-4`}>
              <div className="flex items-center gap-2 mb-3">
                <HardDrive className={`w-5 h-5 ${mutedClass}`} />
                <h3 className="text-lg font-semibold">Storage Distribution</h3>
              </div>
              
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={storageAnalytics.data}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${((percent || 0) * 100).toFixed(0)}%`
                    }
                  >
                    {storageAnalytics.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                      border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '0.5rem',
                      color: darkMode ? '#fff' : '#000',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <p className={`text-xs ${mutedClass} mt-3`}>
                {storageAnalytics.freePercent}% of total storage ({storageAnalytics.freeGB} GB) remains available across the network
              </p>
            </div>

            {/* Status Distribution */}
            <div className={`${cardClass} border ${borderClass} rounded-lg p-4`}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className={`w-5 h-5 ${mutedClass}`} />
                <h3 className="text-lg font-semibold">Status Distribution</h3>
              </div>
              
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    dataKey="count"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    labelLine={false}
                    label={({ payload, percent }) =>
                      `${payload.status} ${((percent || 0) * 100).toFixed(0)}%`
                    }
                  >
                    {statusDistribution.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                      border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '0.5rem',
                      color: darkMode ? '#fff' : '#000',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <p className={`text-xs ${mutedClass} mt-3`}>
                {statusSummary.activePercent}% of nodes ({statusSummary.active}/{statusSummary.total}) are currently active and operational
              </p>
            </div>
          </div>
        </div>
      </div>
  );
}
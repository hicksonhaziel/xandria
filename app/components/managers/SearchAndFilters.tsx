'use client';

import { Search, Download, Check } from 'lucide-react';

interface Props {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  filterNetwork: string;
  setFilterNetwork: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  exportData: () => void;
  darkMode: boolean;
  borderClass: string;
  mutedClass: string;
}

const networkOptions = [
  { value: 'all', label: 'All Networks' },
  { value: 'devnet', label: 'Devnet' },
  { value: 'mainnet', label: 'Mainnet' },
  { value: 'both', label: 'Both' },
];

export default function ManagersSearchAndFilters({
  searchTerm,
  setSearchTerm,
  filterNetwork,
  setFilterNetwork,
  sortBy,
  setSortBy,
  exportData,
  darkMode,
  borderClass,
  mutedClass,
}: Props) {
  return (
    <div className="mb-6">
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${mutedClass}`}
          />
          <input
            type="text"
            placeholder="Search by manager address or node pubkey..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 ${
              darkMode ? 'bg-[#0B0F14]' : 'bg-gray-100'
            } border ${borderClass} rounded-lg focus:outline-none focus:ring-2 ${
              darkMode ? 'focus:ring-purple-500/50' : 'focus:ring-purple-400/50'
            } transition-all text-sm`}
          />
        </div>

        {/* Network Filter Pills */}
        <div className={`flex items-center gap-1 p-1 rounded-lg border ${borderClass} w-fit`}>
          {networkOptions.map((option) => {
            const active = filterNetwork === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setFilterNetwork(option.value)}
                className={`px-3 py-2 rounded-md text-xs font-medium transition-all flex items-center gap-1.5
                  ${
                    active
                      ? darkMode
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'bg-purple-100 text-purple-700 border border-purple-300'
                      : darkMode
                      ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                {active && <Check className="w-3 h-3" />}
                {option.label}
              </button>
            );
          })}
        </div>

        {/* Sort Select */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className={`px-4 py-2.5 ${
            darkMode ? 'bg-gray-800' : 'bg-gray-100'
          } border ${borderClass} rounded-lg focus:outline-none focus:ring-2 ${
            darkMode ? 'focus:ring-purple-500/50' : 'focus:ring-purple-400/50'
          } cursor-pointer text-sm font-medium`}
        >
          <option value="nodes">Most Nodes</option>
          <option value="active">Most Active</option>
          <option value="recent">Recently Registered</option>
        </select>

        {/* Export Button */}
        <button
          onClick={exportData}
          className={`px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 text-sm font-medium whitespace-nowrap ${
            darkMode
              ? 'bg-gray-700 text-white hover:bg-gray-600'
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
          }`}
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>
    </div>
  );
}
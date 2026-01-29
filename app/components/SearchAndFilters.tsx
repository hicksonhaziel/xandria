'use client';

import { Search, Download, Check, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface Props {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  exportData: () => void; 
  darkMode: boolean;
  cardClass: string;
  borderClass: string;
  mutedClass: string;
}

const statusOptions = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'syncing', label: 'Syncing' },
  { value: 'offline', label: 'Offline' },
];

const sortOptions = [
  { value: 'score', label: 'Score' },
  { value: 'uptime', label: 'Uptime' },
  { value: 'storage', label: 'Storage' },
  { value: 'new', label: 'NEW' },
  { value: 'public', label: 'Public' },
];

export default function SearchAndFilters({
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  sortBy,
  setSortBy,
  exportData,
  darkMode,
  cardClass,
  borderClass,
  mutedClass,
}: Props) {
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setSortDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedSort = sortOptions.find(opt => opt.value === sortBy);

  return (
    <div className="mb-4">
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${mutedClass}`}
          />
          <input
            type="text"
            placeholder="Search by ID, pubkey, or IP address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 ${
              darkMode ? 'bg-[#0B0F14]' : 'bg-gray-100'
            } border ${borderClass} rounded-lg focus:outline-none focus:ring-1 ${
              darkMode ? 'focus:ring-gray-600' : 'focus:ring-gray-300'
            } transition-all text-sm`}
          />
        </div>

        {/* Status Filter Pills */}
        <div className={`flex items-center gap-1 p-1 rounded-lg border ${borderClass} w-fit`}>
          {statusOptions.map((option) => {
            const active = filterStatus === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setFilterStatus(option.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5
                  ${
                    active
                      ? darkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-200 text-gray-900'
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

        {/* Sort Dropdown */}
        <div className="relative" ref={sortDropdownRef}>
          <button
            onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
            className={`px-3 py-2 rounded-lg border ${borderClass} transition-colors flex items-center gap-2 text-xs font-medium whitespace-nowrap ${
              darkMode
                ? 'bg-gray-800 text-white hover:bg-gray-700'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
            }`}
          >
            <span>Sort by: {selectedSort?.label}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {sortDropdownOpen && (
            <div 
              className={`absolute top-full mt-1 right-0 ${cardClass} border ${borderClass} rounded-lg shadow-lg overflow-hidden min-w-[160px] z-50`}
            >
              {sortOptions.map((option) => {
                const active = sortBy === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value);
                      setSortDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs font-medium transition-colors flex items-center justify-between gap-2 ${
                      active
                        ? darkMode
                          ? 'bg-gray-700 text-white'
                          : 'bg-gray-200 text-gray-900'
                        : darkMode
                        ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <span>{option.label}</span>
                    {active && <Check className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Export Button */}
        <button
          onClick={exportData}
          className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${
            darkMode
              ? 'bg-gray-700 text-white hover:bg-gray-600'
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
          }`}
        >
          <Download className="w-3 h-3" />
          <span>Export</span>
        </button>
      </div>
    </div>
  );
}
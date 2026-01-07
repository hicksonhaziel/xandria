"use client"

import React from 'react';
import Image from "next/image";
import { motion } from 'framer-motion';
import { Sun, Moon, ExternalLink } from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';

const Header: React.FC = () => {
  const { darkMode, setDarkMode } = useAppContext();
  
  // Network is always devnet, mainnet is disabled
  const network = 'devnet';

  const cardClass = darkMode 
    ? 'bg-[#0B0F14]/50 bg-opacity-50 backdrop-blur-md' 
    : 'bg-white/50 bg-opacity-50 backdrop-blur-lg';
  
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-600';
  const borderClass = darkMode ? 'border-gray-800' : 'border-gray-200';

  return (
    <motion.header 
      className={`${cardClass} border-b ${borderClass} fixed top-0 left-0 right-0 z-50`}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center space-x-3">
            <Image
              src="/xandria.png"
              alt="XANDRIA logo"
              width={45}
              height={45}
              className='rounded-lg'
              priority
            />
            <div className='hidden lg:block'>
              <h1 className="text-2xl font-bold">
                Xandria
              </h1>
              <p className={`text-xs ${mutedClass}`}>Xandeum pNode Analytics</p>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {/* Network Toggle */}
            <div className={`flex items-center rounded-lg border ${borderClass} ${cardClass} p-1`}>
              {/* Devnet - Active */}
              <button
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-orange-500/20 text-orange-400 shadow-sm cursor-default"
              >
                Devnet
              </button>

              {/* Mainnet - Disabled with tooltip */}
              <div className="relative group">
                <button
                  disabled
                  className={`px-3 py-1.5 rounded-md text-xs font-medium ${mutedClass} opacity-50 cursor-not-allowed flex items-center gap-1.5`}
                >
                  Mainnet
                  <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[9px] font-bold rounded uppercase">
                    Soon
                  </span>
                </button>

                {/* Tooltip on hover */}
                <div className={`absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg ${
                  darkMode ? 'bg-gray-800' : 'bg-gray-900'
                } text-white text-xs whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50`}>
                  <div className="font-semibold mb-0.5">Coming Soon</div>
                  <div className="text-gray-400 text-[10px]">Mainnet is currently in development for Xandria</div>
                  {/* Arrow */}
                  <div className={`absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 ${
                    darkMode ? 'bg-gray-800' : 'bg-gray-900'
                  }`}></div>
                </div>
              </div>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${cardClass} hover:bg-opacity-80 transition-all border ${borderClass}`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Docs Link */}
            <a
              href="https://docs.xandeum.network"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-purple-500/15 hover:bg-purple-700/15 rounded-lg transition-colors"
            >
              <span className="text-sm font-medium">Docs</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Mobile Docs Icon */}
            <a
              href="https://docs.xandeum.network"
              target="_blank"
              rel="noopener noreferrer"
              className="sm:hidden p-2 rounded-lg bg-purple-500/15 hover:bg-purple-700/15 transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
"use client"

import React from 'react';
import Image from "next/image";
import { motion } from 'framer-motion';
import { Sun, Moon, ExternalLink } from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';

const Header: React.FC = () => {
  const { darkMode, setDarkMode } = useAppContext();
  
  // TODO: Add network state to AppContext
  const [network, setNetwork] = React.useState<'devnet' | 'mainnet'>('mainnet');
  
  const cardClass = darkMode 
    ? 'bg-[#0B0F14]/50 bg-opacity-50 backdrop-blur-md' 
    : 'bg-white bg-opacity-70 backdrop-blur-lg';
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
            <div>
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
              <button
                onClick={() => setNetwork('devnet')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  network === 'devnet'
                    ? 'bg-orange-500/20 text-orange-400 shadow-sm'
                    : `${mutedClass} hover:text-orange-400`
                }`}
              >
                Devnet
              </button>
              <button
                onClick={() => setNetwork('mainnet')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  network === 'mainnet'
                    ? 'bg-green-500/20 text-green-400 shadow-sm'
                    : `${mutedClass} hover:text-green-400`
                }`}
              >
                Mainnet
              </button>
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
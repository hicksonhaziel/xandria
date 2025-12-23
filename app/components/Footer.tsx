"use client"
import React from 'react';
import { useAppContext } from '@/app/context/AppContext';

const Footer: React.FC = () => {
  const { darkMode } = useAppContext();

  const cardClass = darkMode 
    ? 'bg-gray-800 bg-opacity-50 backdrop-blur-lg' 
    : 'bg-white bg-opacity-70 backdrop-blur-lg';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-600';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';

  return (
    <footer className={`${cardClass} border-t ${borderClass} mt-12`}>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className={mutedClass}>
            Built for the Xandeum pNode Analytics Bounty
          </p>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <a 
              href="https://xandeum.network" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              Xandeum Network
            </a>
            <span className={mutedClass}>•</span>
            <a 
              href="https://discord.gg/uqRSmmM5m" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              Discord
            </a>
            <span className={mutedClass}>•</span>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
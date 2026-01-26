"use client"
import React from 'react';
import { useAppContext } from '@/app/context/AppContext';

const Footer: React.FC = () => {
  const { darkMode } = useAppContext();
  
  const cardClass = darkMode 
    ? 'bg-[#0B0F14] bg-opacity-50 backdrop-blur-lg' 
    : 'bg-white bg-opacity-70 backdrop-blur-lg';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-600';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';

  return (
    <footer className={`${cardClass} border-t ${borderClass} mt-12`}>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          
          {/* Tagline */}
          <p className={`${mutedClass} text-sm text-center md:text-left`}>
            Built for the Xandeum pNodes operators community.
          </p>
          
          {/* Links */}
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
            
            {/* Built by section */}
            <div className="flex items-center gap-2 text-sm">
              <span className={mutedClass}>Built by</span>
              <a 
                href="https://github.com/hicksonhaziel" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-purple-400 hover:text-purple-300 transition-colors font-medium"
              >
                Hickson
              </a>
            </div>
            
            {/* Social links */}
            <div className="flex items-center gap-3">
              <span className={`${mutedClass} hidden sm:inline`}>•</span>
              <a 
                href="https://x.com/devhickson" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-purple-400 hover:text-purple-300 transition-colors text-sm"
              >
                X
              </a>
              <span className={mutedClass}>•</span>
              <a 
                href="https://github.com/hicksonhaziel/xandria" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-purple-400 hover:text-purple-300 transition-colors text-sm"
              >
                GitHub
              </a>
            </div>
            
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
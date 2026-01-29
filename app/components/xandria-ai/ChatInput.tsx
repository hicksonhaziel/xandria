import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { checkRateLimit, getRemainingTime } from '@/app/components/xandria-ai/rateLimitUtils';

interface ChatInputProps {
  message: string;
  setMessage: (message: string) => void;
  onSend: () => void;
  isSending: boolean;
  darkMode: boolean;
  onRateLimitError: (message: string) => void;
}

const ChatInput = ({ message, setMessage, onSend, isSending, darkMode, onRateLimitError }: ChatInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedModel, setSelectedModel] = useState<'xandria-base-knl' | 'xandria-elite'>('xandria-base-knl');
  const [showModels, setShowModels] = useState(false);
  const modelRef = useRef<HTMLDivElement>(null);

  const bgClass = darkMode ? 'bg-[#0B0F14]' : 'bg-gray-50';
  const cardClass = darkMode 
    ? 'bg-[#111827] bg-opacity-50 backdrop-blur-lg' 
    : 'bg-white bg-opacity-70 backdrop-blur-lg';
  const textClass = darkMode ? 'text-gray-100' : 'text-gray-900';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-600';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 200; 
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [message]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) {
        setShowModels(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSendClick = () => {
    // Check rate limit before sending
    const rateLimit = checkRateLimit();
    if (!rateLimit.allowed) {
      const timeRemaining = getRemainingTime(rateLimit.resetTime);
      onRateLimitError(`You've reached your daily message limit. Please try again in ${timeRemaining}.`);
      return;
    }
    onSend();
  };

  return (
    <div className={bgClass}>
      <div className="max-w-4xl mx-auto px-4 py-2">
        <div className={`${cardClass} border ${borderClass} rounded-xl shadow-sm`}>
          <div className="flex items-end gap-2 p-2">
            
            <div className="flex-1">
              {/* Model Selector */}
              <div className="relative flex-shrink-0" ref={modelRef}>
                <button
                  onClick={() => setShowModels(!showModels)}
                  className={`p-2 rounded-lg transition-colors flex items-center gap-1`}
                  title="Select Model"
                >
                  <Image
                    src="/xandria.png"
                    alt="Model"
                    width={20}
                    height={20}
                    className='rounded'
                  />
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showModels && (
                  <div className={`absolute bottom-full left-0 mb-2 ${cardClass} border ${borderClass} rounded-lg shadow-lg p-2 w-48 z-10`}>
                    <button
                      onClick={() => {
                        setSelectedModel('xandria-base-knl');
                        setShowModels(false);
                      }}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg ${selectedModel === 'xandria-base-knl' ? 'bg-purple-600/15' : ''}`}
                    >
                      <Image src="/xandria.png" alt="Base" width={20} height={20} className='rounded' />
                      <span className="text-sm">Xandria Base</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedModel('xandria-elite');
                        setShowModels(false);
                      }}
                      disabled
                      className={`w-full flex items-center gap-2 p-2 rounded-lg ${selectedModel === 'xandria-elite' ? 'bg-purple-600/15' : ''}`}
                    >
                      <Image src="/xandria.png" alt="Elite" width={20} height={20} className='rounded' />
                      <span className="text-sm">Xandria Elite</span>
                      <span className="text-[9px] font-bold text-yellow-500 border border-yellow-500/50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                        Soon
                      </span>
                    </button>
                  </div>
                )}
              </div>
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendClick();
                  }
                }}
                placeholder="Ask anything about xandeum network..."
                disabled={isSending}
                className={`w-full bg-transparent outline-none resize-none ${textClass} placeholder:${mutedClass} disabled:opacity-50`}
                rows={1}
                style={{ 
                  lineHeight: '1.5',
                  minHeight: '36px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              />
            </div>
            
            <button
              onClick={handleSendClick}
              disabled={!message.trim() || isSending}
              className={`p-2.5 rounded-lg transition-all flex-shrink-0 ${
                message.trim() && !isSending
                  ? 'bg-purple-600/15 hover:bg-purple-600/10 text-white shadow-sm' 
                  : `${mutedClass} cursor-not-allowed opacity-50`
              }`}
              title="Send message"
            >
              {isSending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        <div className={`text-xs ${mutedClass} mt-2 text-center`}>
          Xandria AI can make mistakes. Consider checking important information.
        </div>
      </div>
      
      {/* Hide scrollbar for textarea */}
      <style jsx>{`
        textarea::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default ChatInput;
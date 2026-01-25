'use client';

import { useRef, useState, useEffect } from 'react';
import Image from "next/image";
import { useRouter, useParams } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';
import Header from '@/app/components/Header';
import Sidebar from '@/app/components/Sidebar';
import ChatMessage from '@/app/components/xandria-ai/ChatMessage';
import ChatInput from '@/app/components/xandria-ai/ChatInput';
import SessionsSidebar from '@/app/components/xandria-ai/SessionsSidebar';
import LoadingSkeleton from '@/app/components/xandria-ai/LoadingSkeleton';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import ErrorModal from '@/app/components/xandria-ai/ErrorModal';
import { checkRateLimit, incrementRateLimit, getRemainingTime } from '@/app/components/xandria-ai/rateLimitUtils';
import { ExternalLink, Settings2, Coins, BarChart3, Wrench, ArrowUpRight } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: number;
  role: 'user' | 'model';
  content: string;
  created_at?: string;
  rating?: boolean | null;
  sources?: any[];
  parent_id?: number | null;
  isRegenerating?: boolean;
}

interface Session {
  session_id: string;
  last_updated: string;
  message_count: number;
  summary?: string;
}

const XandriaAI = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const params = useParams();
  const { darkMode } = useAppContext();
  const { publicKey, connected } = useWallet();

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSessions, setShowSessions] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Error modal states
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });

  const bgClass = darkMode ? 'bg-[#0B0F14]' : 'bg-gray-50';
  const cardClass = darkMode 
    ? 'bg-[#111827] bg-opacity-50 backdrop-blur-lg' 
    : 'bg-white bg-opacity-70 backdrop-blur-lg';
  const textClass = darkMode ? 'text-gray-100' : 'text-gray-900';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-600';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';
  const hoverClass = darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100';

  const showError = (message: string) => {
    setErrorModal({ isOpen: true, message });
  };

  const closeError = () => {
    setErrorModal({ isOpen: false, message: '' });
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiThinking]);

  // Handle URL params and load session - FIXED to prevent auto-reload
  useEffect(() => {
    if (connected && publicKey && !hasInitialized) {
      const urlSessionId = params?.session as string;
      
      if (urlSessionId) {
        setSessionId(urlSessionId);
        loadHistory(urlSessionId);
      } else if (!sessionId) {
        setSessionId(uuidv4());
      }
      
      loadSessions();
      setHasInitialized(true);
    } else if (!connected) {
      setMessages([]);
      setSessionId('');
      setSessions([]);
      setHasInitialized(false);
    }
  }, [connected, publicKey]);

  // Separate effect for session changes from URL
  useEffect(() => {
    if (connected && publicKey && hasInitialized) {
      const urlSessionId = params?.session as string;
      if (urlSessionId && urlSessionId !== sessionId) {
        setSessionId(urlSessionId);
        loadHistory(urlSessionId);
      }
    }
  }, [params?.session]);

  const loadSessions = async () => {
    if (!publicKey) return;

    try {
      const response = await fetch(`/api/xandria-ai?action=sessions&wallet_address=${publicKey.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  };

  const loadHistory = async (sid: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/xandria-ai?action=history&session_id=${sid}`);
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.messages || []);
        setSessionId(sid);
        setShowSessions(false);
      } else {
        setError(data.error || 'Failed to load history');
      }
    } catch (err) {
      setError('Failed to load conversation history');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || !connected || !publicKey || isSending) return;

     // Check rate limit
        const rateLimit = checkRateLimit();
        if (!rateLimit.allowed) {
          const timeRemaining = getRemainingTime(rateLimit.resetTime);
          showError(`You've reached your daily message limit. Please try again in ${timeRemaining}.`);
          return;
        }
    
    const userMessage = message.trim();
    const isFirstMessage = messages.length === 0;
    
    setMessage('');
    setIsSending(true);
    setIsAiThinking(true);
    setError(null);

    // Add user message optimistically
    const tempUserMsg: Message = {
      id: Date.now(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const response = await fetch('/api/xandria-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          session_id: sessionId,
          wallet_address: publicKey.toString(),
          message: userMessage,
          parent_id: messages.length > 0 ? messages[messages.length - 1].id : null
        })
      });

      const data = await response.json();

      if (data.success) {

        // Increment rate limit counter only on successful send
                incrementRateLimit();

        // Update URL on first message without reloading
        if (isFirstMessage) {
          window.history.pushState({}, '', `/xandria-ai/${sessionId}`);
        }

        // Update user message with actual ID
        setMessages(prev => prev.map(msg => 
          msg.id === tempUserMsg.id 
            ? { ...msg, id: data.user_message_id } 
            : msg
        ));

        // Add AI response
        const aiMessage: Message = {
          id: data.model_message_id,
          role: 'model',
          content: data.answer,
          sources: data.sources,
          created_at: new Date().toISOString(),
          rating: null
        };
        setMessages(prev => [...prev, aiMessage]);
        
        // Refresh sessions
        loadSessions();
      } else {
        setError(data.error || 'Failed to send message');
        setMessages(prev => prev.filter(msg => msg.id !== tempUserMsg.id));
      }
    } catch (err) {
      setError('Failed to send message. Please try again.');
      console.error(err);
      setMessages(prev => prev.filter(msg => msg.id !== tempUserMsg.id));
    } finally {
      setIsSending(false);
      setIsAiThinking(false);
    }
  };

  const handleRegenerate = async (messageId: number, messageIndex: number) => {
    if (!connected || !publicKey || isSending) return;

    const parentId = messageIndex > 0 ? messages[messageIndex - 1].id : null;

    setMessages(prev => prev.map((msg, idx) => 
      idx === messageIndex ? { ...msg, isRegenerating: true } : msg
    ));
    setIsSending(true);
    setError(null);

    try {
      const response = await fetch('/api/xandria-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'regenerate',
          session_id: sessionId,
          wallet_address: publicKey.toString(),
          parent_id: parentId
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessages(prev => prev.map((msg, idx) => 
          idx === messageIndex 
            ? {
                ...msg,
                id: data.message_id,
                content: data.answer,
                sources: data.sources,
                rating: null,
                isRegenerating: false
              }
            : msg
        ));
      } else {
        setError(data.error || 'Failed to regenerate response');
        setMessages(prev => prev.map((msg, idx) => 
          idx === messageIndex ? { ...msg, isRegenerating: false } : msg
        ));
      }
    } catch (err) {
      setError('Failed to regenerate response');
      console.error(err);
      setMessages(prev => prev.map((msg, idx) => 
        idx === messageIndex ? { ...msg, isRegenerating: false } : msg
      ));
    } finally {
      setIsSending(false);
    }
  };

  const handleRate = async (messageId: number, rating: boolean, messageIndex: number) => {
    if (!connected) return;

    setMessages(prev => prev.map((msg, idx) => 
      idx === messageIndex ? { ...msg, rating } : msg
    ));

    try {
      const response = await fetch('/api/xandria-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rate',
          message_id: messageId,
          rating
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        setMessages(prev => prev.map((msg, idx) => 
          idx === messageIndex ? { ...msg, rating: null } : msg
        ));
        setError(data.error || 'Failed to rate message');
      }
    } catch (err) {
      setMessages(prev => prev.map((msg, idx) => 
        idx === messageIndex ? { ...msg, rating: null } : msg
      ));
      console.error(err);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const startNewChat = () => {
    const newSessionId = uuidv4();
    setSessionId(newSessionId);
    setMessages([]);
    setShowSessions(false);
    window.history.pushState({}, '', '/xandria-ai');
  };

  const handleSelectSession = (sid: string) => {
    loadHistory(sid);
    window.history.pushState({}, '', `/xandria-ai/${sid}`);
  };

  const suggestedPrompts = [
    { icon: Settings2, title: 'How do I set up a pnode?', desc: 'Get started with pnodes' },
    { icon: Coins, title: 'Explain Xand tokenomics', desc: 'Learn about the ecosystem' },
    { icon: BarChart3, title: 'Check my node performance', desc: 'Monitor your nodes' },
    { icon: Wrench, title: 'Troubleshoot node issues', desc: 'Fix common problems' }
  ];

  // AI Thinking Component
  const AiThinking = () => (
    <div className="flex gap-4 justify-start">
      <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center`}>
        <Image
          src="/xandria.png"
          alt="XANDRIA logo"
          width={45}
          height={45}
          className='rounded-lg'
          priority
        />
      </div>
      <div className="max-w-3xl">
        <div className={`${mutedClass} text-xs font-semibold mb-2`}>Xandria AI</div>
        <div className="flex items-center gap-1 py-2">
          <div className={`w-2 h-2 rounded-full ${darkMode ? 'bg-purple-400' : 'bg-purple-600'} animate-bounce`} style={{ animationDelay: '0ms', animationDuration: '0.6s' }}></div>
          <div className={`w-2 h-2 rounded-full ${darkMode ? 'bg-purple-400' : 'bg-purple-600'} animate-bounce`} style={{ animationDelay: '150ms', animationDuration: '0.6s' }}></div>
          <div className={`w-2 h-2 rounded-full ${darkMode ? 'bg-purple-400' : 'bg-purple-600'} animate-bounce`} style={{ animationDelay: '300ms', animationDuration: '0.6s' }}></div>
        </div>
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className={`min-h-screen ${bgClass} ${textClass} transition-colors duration-300`}>
      <Header />
      <Sidebar />
      <ErrorModal 
        isOpen={errorModal.isOpen} 
        onClose={closeError} 
        message={errorModal.message}
        darkMode={darkMode}
      />

      <div className="pt-20 pb-24 lg:pb-8 px-4 sm:px-6 lg:ml-64 min-h-screen">
        <div className="flex flex-col h-[calc(100vh-5rem)]">
          
          {/* Top Bar */}
          <div className={`border-b ${borderClass} px-4 py-2 flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSessions(!showSessions)}
                className={`p-2 rounded-lg ${hoverClass} transition-colors`}
                title="Sessions"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-md font-bold">Xandria AI</h1>
            </div>
            
            <div className="flex items-center gap-3">
              {connected && (
                <button
                  onClick={startNewChat}
                  className="px-4 py-2 flex gap-2 bg-purple-600/15 hover:bg-purple-800/15 rounded-lg transition-colors text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="text">New</span> 
                </button>
              )}
            </div>
          </div>

          {/* Sessions Sidebar */}
          {showSessions && connected && (
            <SessionsSidebar
              sessions={sessions}
              currentSessionId={sessionId}
              onSelectSession={handleSelectSession}
              onClose={() => setShowSessions(false)}
              darkMode={darkMode}
            />
          )}

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            {!connected ? (
              <div className="max-w-4xl mx-auto text-center py-12">
                <div className={`inline-flex items-center justify-center w-16 h-16 mb-4`}>
                  <Image
                    src="/xandria.png"
                    alt="XANDRIA logo"
                    width={45}
                    height={45}
                    className='rounded-lg'
                    priority
                  />
                </div>
                <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
                <p className={`${mutedClass} mb-6`}>
                  Please connect your Solana wallet to start chatting with Xandria AI
                </p>
                <WalletMultiButton />
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-6">
                
                {/* Welcome Section */}
                {messages.length === 0 && !isLoading && !isAiThinking && (
                  <div className="text-center py-12">
                    <div className={`inline-flex items-center justify-center w-16 h-16 mb-4`}>
                      <Image
                        src="/xandria.png"
                        alt="XANDRIA logo"
                        width={45}
                        height={45}
                        className='rounded-lg'
                        priority
                      />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Welcome to Xandria AI</h1>
                    <p className={`${mutedClass} mb-8`}>How can I assist you today?</p>
                    
                    {/* Suggested Prompts Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl mx-auto mt-8">
                      {suggestedPrompts.map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => setMessage(prompt.title)}
                          className={`${cardClass} border ${borderClass} rounded-xl p-4 text-left transition-all hover:border-purple-500/50 group relative overflow-hidden`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="p-2.5 rounded-lg bg-purple-600/10 text-purple-600 shrink-0">
                              <prompt.icon size={18} strokeWidth={2.5} />
                            </div>

                            <div className="flex-1 pr-4">
                              <div className={`font-medium ${textClass} text-sm mb-0.5 flex items-center gap-1`}>
                                {prompt.title}
                              </div>
                              <div className={`text-xs ${mutedClass} leading-relaxed`}>
                                {prompt.desc}
                              </div>
                            </div>
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <ArrowUpRight className={`w-3 h-3 ${mutedClass}`} />
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className="bg-red-500 bg-opacity-10 border border-red-500 rounded-lg p-4">
                    <p className="text-red-500">{error}</p>
                  </div>
                )}

                {/* Loading State */}
                {isLoading && <LoadingSkeleton darkMode={darkMode} />}

                {/* Messages */}
                {messages.map((msg, idx) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    index={idx}
                    isLastAiMessage={idx === messages.length - 1 && msg.role === 'model'}
                    isSending={isSending}
                    darkMode={darkMode}
                    onCopy={handleCopy}
                    onRegenerate={handleRegenerate}
                    onRate={handleRate}
                  />
                ))}

                {/* AI Thinking Indicator */}
                {isAiThinking && <AiThinking />}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          {connected && (
            <ChatInput
              message={message}
              setMessage={setMessage}
              onSend={handleSend}
              isSending={isSending}
              darkMode={darkMode}
              onRateLimitError={showError}
            />
          )}

        </div>
      </div>
    </div>
  );
};

export default XandriaAI;
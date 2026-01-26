'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { ExternalLink, Settings2, Coins, BarChart3, Wrench, ArrowUpRight } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';
import Header from '@/app/components/Header';
import Sidebar from '@/app/components/Sidebar';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import ErrorModal from '@/app/components/xandria-ai/ErrorModal';
import { checkRateLimit, incrementRateLimit, getRemainingTime } from '@/app/components/xandria-ai/rateLimitUtils';

interface Source {
  score: number;
  section: string;
  source: string;
  category: string;
  content: string;
}

interface Message {
  id: number;
  role: 'user' | 'model';
  content: string;
  created_at?: string;
  rating?: boolean | null;
  sources?: Source[];
  parent_id?: number | null;
  isRegenerating?: boolean;
  network_data_used?: boolean;
}

interface Session {
  session_id: string;
  last_updated: string;
  message_count: number;
}

const XandriaAISession = () => {
  const params = useParams();
  const sessionId = params.session as string;
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const { darkMode } = useAppContext();
  const { publicKey, connected } = useWallet();

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [expandedSources, setExpandedSources] = useState<{[key: number]: boolean}>({});
  
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

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 200;
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [message]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load session history when component mounts or sessionId changes
  useEffect(() => {
    if (connected && publicKey && sessionId) {
      loadHistory(sessionId);
      loadSessions();
    } else if (!connected) {
      router.push('/xandria-ai');
    }
  }, [connected, publicKey, sessionId]);

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

    try {
      const response = await fetch(`/api/xandria-ai?action=history&session_id=${sid}`);
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.messages || []);
      } else {
        showError('Unable to load your conversation. Please try again.');
      }
    } catch (err) {
      showError('Unable to load your conversation. Please try again.');
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
    setMessage('');
    setIsSending(true);

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

        // Update user message with actual ID
        setMessages(prev => prev.map(msg => 
          msg.id === tempUserMsg.id 
            ? { ...msg, id: data.user_message_id } 
            : msg
        ));

        // Add AI response with sources
        const aiMessage: Message = {
          id: data.model_message_id,
          role: 'model',
          content: data.answer,
          sources: data.sources || [],
          network_data_used: data.network_data_used,
          created_at: new Date().toISOString(),
          rating: null
        };
        setMessages(prev => [...prev, aiMessage]);
        
        // Refresh sessions
        loadSessions();
      } else {
        showError('Unable to send your message. Please try again.');
        setMessages(prev => prev.filter(msg => msg.id !== tempUserMsg.id));
      }
    } catch (err) {
      showError('Something went wrong. Please try again.');
      console.error(err);
      setMessages(prev => prev.filter(msg => msg.id !== tempUserMsg.id));
    } finally {
      setIsSending(false);
    }
  };

  const handleRegenerate = async (messageId: number, messageIndex: number) => {
    if (!connected || !publicKey || isSending) return;

    const parentId = messageIndex > 0 ? messages[messageIndex - 1].id : null;

    setMessages(prev => prev.map((msg, idx) => 
      idx === messageIndex ? { ...msg, isRegenerating: true } : msg
    ));
    setIsSending(true);

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
                sources: data.sources || [],
                rating: null,
                isRegenerating: false
              }
            : msg
        ));
      } else {
        showError('Unable to regenerate response. Please try again.');
        setMessages(prev => prev.map((msg, idx) => 
          idx === messageIndex ? { ...msg, isRegenerating: false } : msg
        ));
      }
    } catch (err) {
      showError('Something went wrong. Please try again.');
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
        showError('Unable to save your rating. Please try again.');
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
    router.push('/xandria-ai');
  };

  const toggleSources = (messageId: number) => {
    setExpandedSources(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const suggestedPrompts = [
    { icon: Settings2, title: 'How do I set up a pnode?', desc: 'Get started with pnodes' },
    { icon: Coins, title: 'Explain Xand tokenomics', desc: 'Learn about the ecosystem' },
    { icon: BarChart3, title: 'Check my node performance', desc: 'Monitor your nodes' },
    { icon: Wrench, title: 'Troubleshoot node issues', desc: 'Fix common problems' }
  ];

  if (!connected) {
    return (
      <div ref={containerRef} className={`min-h-screen ${bgClass} ${textClass}`}>
        <Header />
        <Sidebar />
        <div className="pt-20 ml-[4.5rem] lg:ml-64 flex items-center justify-center min-h-[calc(100vh-5rem)]">
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${cardClass} mb-4`}>
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
            <p className={`${mutedClass} mb-6`}>Please connect your Solana wallet to access this chat</p>
            <WalletMultiButton />
          </div>
        </div>
      </div>
    );
  }

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

      <div className="pt-20 transition-all duration-200 ml-[4.5rem] lg:ml-64">
        <div className="flex flex-col h-[calc(100vh-5rem)]">
          
          {/* Top Bar */}
          <div className={`${cardClass} px-6 py-3 flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSessions(!showSessions)}
                className={`p-2 rounded-lg ${hoverClass} transition-colors`}
                title="Sessions"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={startNewChat}
                className="px-4 py-2 flex gap-2 bg-purple-600/15 hover:bg-purple-800/15 rounded-lg transition-colors text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text">New</span> 
              </button>
            </div>
          </div>

          {/* Sessions Sidebar */}
          {showSessions && (
            <div className={`${cardClass} border-r ${borderClass} absolute left-[4.5rem] lg:left-64 top-20 bottom-0 w-64 p-4 overflow-y-auto z-10`}>
              <h2 className="font-semibold mb-3">Your Conversations</h2>
              <div className="space-y-2">
                {sessions.map((session) => (
                  <button
                    key={session.session_id}
                    onClick={() => {
                      router.push(`/xandria-ai/${session.session_id}`);
                      setShowSessions(false);
                    }}
                    className={`w-full text-left p-3 rounded-lg ${hoverClass} ${
                      session.session_id === sessionId ? 'bg-blue-500 bg-opacity-20' : ''
                    }`}
                  >
                    <div className="text-sm font-medium truncate">
                      Session {session.session_id.slice(0, 8)}...
                    </div>
                    <div className={`text-xs ${mutedClass} mt-1`}>
                      {session.message_count} messages • {new Date(session.last_updated).toLocaleDateString()}
                    </div>
                  </button>
                ))}
                {sessions.length === 0 && (
                  <p className={`${mutedClass} text-sm text-center py-4`}>
                    No previous conversations
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="max-w-4xl mx-auto space-y-6">
              
              {/* Welcome Section */}
              {messages.length === 0 && !isLoading && (
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
                  <h1 className="text-3xl font-bold mb-2">Start a New Conversation</h1>
                  <p className={`${mutedClass} mb-8`}>Ask me anything about Xandria</p>
                  
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

              {/* Loading State */}
              {isLoading && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <p className={`${mutedClass} mt-2`}>Loading conversation...</p>
                </div>
              )}

              {/* Messages */}
              {messages.map((msg, idx) => (
                <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'model' && (
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
                  )}
                  
                  <div className={`max-w-3xl ${msg.role === 'user' ? `${cardClass} rounded-2xl px-4 py-3` : ''}`}>
                    {msg.role === 'model' && (
                      <div className={`${mutedClass} text-xs font-semibold mb-2 flex items-center gap-2`}>
                        <span>Xandria AI</span>
                        {msg.network_data_used && (
                          <span className="text-green-500 text-xs">● Live Data</span>
                        )}
                      </div>
                    )}
                    
                    <div className={`${msg.role === 'user' ? textClass : ''} whitespace-pre-wrap leading-relaxed`}>
                      {msg.isRegenerating ? (
                        <div className="flex items-center gap-2">
                          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                          <span className={mutedClass}>Regenerating response...</span>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                    
                    {/* Sources Section */}
                    {msg.role === 'model' && msg.sources && msg.sources.length > 0 && !msg.isRegenerating && (
                      <div className="mt-4">
                        <button
                          onClick={() => toggleSources(msg.id)}
                          className={`text-sm ${mutedClass} hover:text-blue-500 flex items-center gap-1`}
                        >
                          <svg className={`w-4 h-4 transition-transform ${expandedSources[msg.id] ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          {msg.sources.length} Source{msg.sources.length !== 1 ? 's' : ''}
                        </button>
                        
                        {expandedSources[msg.id] && (
                          <div className="mt-2 space-y-2">
                            {msg.sources.map((source, sidx) => (
                              <div key={sidx} className={`${cardClass} border ${borderClass} rounded-lg p-3 text-sm`}>
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <div className="font-semibold">{source.section}</div>
                                    <a 
                                      href={source.source} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-500 hover:underline text-xs"
                                    >
                                      {source.source}
                                    </a>
                                  </div>
                                  <span className={`text-xs ${mutedClass}`}>
                                    {(source.score * 100).toFixed(1)}% match
                                  </span>
                                </div>
                                <p className={`${mutedClass} text-xs line-clamp-3`}>
                                  {source.content.slice(0, 200)}...
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {msg.role === 'model' && !msg.isRegenerating && (
                      <div className="flex gap-2 mt-3">
                        <button 
                          onClick={() => handleCopy(msg.content)}
                          className={`p-1.5 rounded ${hoverClass} transition-colors`} 
                          title="Copy"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        
                        {idx === messages.length - 1 && (
                          <button 
                            onClick={() => handleRegenerate(msg.id, idx)}
                            disabled={isSending}
                            className={`p-1.5 rounded ${hoverClass} transition-colors disabled:opacity-50`} 
                            title="Regenerate"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                        )}
                        
                        <button 
                          onClick={() => handleRate(msg.id, true, idx)}
                          className={`p-1.5 rounded transition-colors ${
                            msg.rating === true ? 'bg-green-500 text-white' : `${hoverClass}`
                          }`}
                          title="Like"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                          </svg>
                        </button>
                        
                        <button 
                          onClick={() => handleRate(msg.id, false, idx)}
                          className={`p-1.5 rounded transition-colors ${
                            msg.rating === false ? 'bg-red-500 text-white' : `${hoverClass}`
                          }`}
                          title="Dislike"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full ${cardClass} flex items-center justify-center`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className={bgClass}>
            <div className="max-w-4xl mx-auto px-4 py-4">
              <div className={`${cardClass} border ${borderClass} rounded-2xl overflow-hidden shadow-sm`}>
                <div className="flex items-end gap-3 p-3">
                  <div className="flex-1">
                    <textarea
                      ref={textareaRef}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Ask anything about Xandria..."
                      disabled={isSending}
                      className={`w-full bg-transparent outline-none resize-none ${textClass} placeholder:${mutedClass} disabled:opacity-50`}
                      rows={1}
                      style={{ 
                        lineHeight: '1.5',
                        minHeight: '40px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none'
                      }}
                    />
                  </div>
                  
                  <button
                    onClick={handleSend}
                    disabled={!message.trim() || isSending}
                    className={`p-2.5 rounded-lg transition-all flex-shrink-0 ${
                      message.trim() && !isSending
                        ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm' 
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
              
              <div className={`text-xs ${mutedClass} mt-3 text-center`}>
                Xandria AI can make mistakes. Consider checking important information.
              </div>
            </div>
          </div>

        </div>
      </div>
      
      {/* Hide scrollbar globally for textarea */}
      <style jsx global>{`
        textarea::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default XandriaAISession;
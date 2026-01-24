import { JSX, useState } from 'react';
import Image from 'next/image';

interface Message {
  id: number;
  role: 'user' | 'assistant' | 'model';
  content: string;
  created_at?: string;
  rating?: boolean | null;
  sources?: any[];
  parent_id?: number | null;
  isRegenerating?: boolean;
}

interface ChatMessageProps {
  message: Message;
  index: number;
  isLastAiMessage: boolean;
  isSending: boolean;
  darkMode: boolean;
  onCopy: (content: string) => void;
  onRegenerate: (messageId: number, messageIndex: number) => void;
  onRate: (messageId: number, rating: boolean, messageIndex: number) => void;
}

const ChatMessage = ({ 
  message, 
  index, 
  isLastAiMessage, 
  isSending,
  darkMode,
  onCopy, 
  onRegenerate, 
  onRate 
}: ChatMessageProps) => {
  const cardClass = darkMode 
    ? 'bg-[#111827] bg-opacity-50 backdrop-blur-lg' 
    : 'bg-white bg-opacity-70 backdrop-blur-lg';
  const textClass = darkMode ? 'text-gray-100' : 'text-gray-900';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-600';
  const hoverClass = darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100';

  const [copiedBlocks, setCopiedBlocks] = useState<Set<number>>(new Set());

  const handleCopyCode = (code: string, blockIndex: number) => {
    navigator.clipboard.writeText(code);
    setCopiedBlocks(prev => new Set(prev).add(blockIndex));
    setTimeout(() => {
      setCopiedBlocks(prev => {
        const next = new Set(prev);
        next.delete(blockIndex);
        return next;
      });
    }, 2000);
  };

  const isAi = message.role === 'model' || message.role === 'assistant';

  const renderMarkdown = (content: string) => {
    const lines = content.split('\n');
    const result: JSX.Element[] = [];
    let i = 0;
    let blockIndex = 0;

    const formatInline = (text: string) => {
      // Bold
      text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
      // Inline code
      text = text.replace(/`([^`]+)`/g, 
        `<code class="px-1.5 py-0.5 rounded text-sm font-mono ${darkMode ? 'bg-gray-800 text-blue-300' : 'bg-gray-200 text-blue-700'}">$1</code>`
      );
      return text;
    };

    while (i < lines.length) {
      const line = lines[i];

      // Code blocks
      if (line.startsWith('```')) {
        const lang = line.slice(3).trim() || 'text';
        const codeLines: string[] = [];
        i++;
        
        while (i < lines.length && !lines[i].startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        
        const code = codeLines.join('\n');
        const currentBlockIndex = blockIndex++;
        
        result.push(
          <div key={`code-${currentBlockIndex}`} className="my-4 rounded-lg overflow-hidden bg-gray-900 border border-gray-700">
            <div className="flex items-center justify-between px-4 py-2 bg-black/40">
              <span className="text-xs font-medium text-gray-400">{lang}</span>
              <button
                onClick={() => handleCopyCode(code, currentBlockIndex)}
                className="flex items-center gap-1.5 px-2 py-1 rounded text-xs hover:bg-gray-700 transition-colors text-gray-300"
              >
                {copiedBlocks.has(currentBlockIndex) ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy code
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
              <code className="text-gray-100 font-mono">{code}</code>
            </pre>
          </div>
        );
        i++;
        continue;
      }

      // Headers
      if (line.startsWith('### ')) {
        result.push(
          <h3 key={`h3-${i}`} className={`text-xl font-bold mt-4 mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            {line.slice(4)}
          </h3>
        );
        i++;
        continue;
      }

      if (line.startsWith('## ')) {
        result.push(
          <h2 key={`h2-${i}`} className={`text-2xl font-bold mt-5 mb-3 pb-2 ${darkMode ? 'border-gray-700' : 'border-gray-300'} border-b`}>
            {line.slice(3)}
          </h2>
        );
        i++;
        continue;
      }

      if (line.startsWith('# ')) {
        result.push(
          <h1 key={`h1-${i}`} className="text-3xl font-bold mt-6 mb-4">
            {line.slice(2)}
          </h1>
        );
        i++;
        continue;
      }

      // Lists
      if (line.match(/^[\*\-]\s+/)) {
        const listItems: JSX.Element[] = [];
        const startIndex = i;
        
        while (i < lines.length) {
          const currentLine = lines[i];
          
          if (currentLine.match(/^[\*\-]\s+/)) {
            const itemContent = currentLine.replace(/^[\*\-]\s+/, '');
            const nestedItems: JSX.Element[] = [];
            
            let j = i + 1;
            while (j < lines.length && lines[j].match(/^\s{2,}[\*\-]\s+/)) {
              const nestedContent = lines[j].trim().replace(/^[\*\-]\s+/, '');
              nestedItems.push(
                <li key={`nested-${j}`} className="mb-1">
                  <span dangerouslySetInnerHTML={{ __html: formatInline(nestedContent) }} />
                </li>
              );
              j++;
            }
            
            listItems.push(
              <li key={`li-${i}`} className="mb-2">
                <span dangerouslySetInnerHTML={{ __html: formatInline(itemContent) }} />
                {nestedItems.length > 0 && (
                  <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                    {nestedItems}
                  </ul>
                )}
              </li>
            );
            
            i = j;
          } else if (currentLine.trim() === '') {
            i++;
            break;
          } else {
            break;
          }
        }
        
        result.push(
          <ul key={`ul-${startIndex}`} className="list-disc list-outside ml-6 mb-4">
            {listItems}
          </ul>
        );
        continue;
      }

      // Tables
      if (line.includes('|') && line.trim().startsWith('|')) {
        const tableRows: string[][] = [];
        const tableStart = i;
        
        while (i < lines.length && lines[i].includes('|')) {
          const cells = lines[i].split('|').map(c => c.trim()).filter(c => c);
          
          if (!cells.every(c => c.match(/^:?-+:?$/))) {
            tableRows.push(cells);
          }
          i++;
        }
        
        if (tableRows.length > 0) {
          const headers = tableRows[0];
          const rows = tableRows.slice(1);
          
          result.push(
            <div key={`table-${tableStart}`} className="overflow-x-auto my-4">
              <table className={`min-w-full border-collapse ${darkMode ? 'border-gray-700' : 'border-gray-300'} border`}>
                <thead>
                  <tr>
                    {headers.map((header, idx) => (
                      <th 
                        key={idx} 
                        className={`border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-200'} px-4 py-2 text-left font-semibold`}
                      >
                        <span dangerouslySetInnerHTML={{ __html: formatInline(header) }} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className={`border ${darkMode ? 'border-gray-700' : 'border-gray-300'} px-4 py-2`}>
                          <span dangerouslySetInnerHTML={{ __html: formatInline(cell) }} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        continue;
      }

      // Horizontal rule
      if (line.match(/^[-*]{3,}$/)) {
        result.push(<hr key={`hr-${i}`} className={`my-6 ${darkMode ? 'border-gray-700' : 'border-gray-300'}`} />);
        i++;
        continue;
      }

      
      // Regular paragraph
      if (line.trim()) {
        result.push(
          <p key={`p-${i}`} className="mb-3 leading-relaxed">
            <span dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
          </p>
        );
      }
      
      i++;
    }

    return result;
  };

  // Loading animation component
  const LoadingDots = () => (
    <div className="flex items-center gap-1 py-2">
      <div className={`w-2 h-2 rounded-full ${darkMode ? 'bg-purple-400' : 'bg-purple-600'} animate-bounce`} style={{ animationDelay: '0ms' }}></div>
      <div className={`w-2 h-2 rounded-full ${darkMode ? 'bg-purple-400' : 'bg-purple-600'} animate-bounce`} style={{ animationDelay: '150ms' }}></div>
      <div className={`w-2 h-2 rounded-full ${darkMode ? 'bg-purple-400' : 'bg-purple-600'} animate-bounce`} style={{ animationDelay: '300ms' }}></div>
    </div>
  );

  return (
    <div className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      {isAi && (
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
      
      <div className={`max-w-3xl ${message.role === 'user' ? `${cardClass} rounded-2xl px-4 py-3` : ''}`}>
        {isAi && (
          <div className={`${mutedClass} text-xs font-semibold mb-2`}>Xandria AI</div>
        )}
        
        <div className={`${message.role === 'user' ? textClass : ''}`}>
          {message.isRegenerating ? (
            <div className="flex items-center gap-2">
              <LoadingDots />
              <span className={mutedClass}>Regenerating response...</span>
            </div>
          ) : (
            <div className={textClass}>
              {isAi ? renderMarkdown(message.content) : message.content}
            </div>
          )}
        </div>
        
        {isAi && !message.isRegenerating && (
          <div className="flex gap-2 mt-3">
            <button 
              onClick={() => onCopy(message.content)}
              className={`p-1.5 rounded ${hoverClass} transition-colors`} 
              title="Copy"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            
            {isLastAiMessage && (
              <button 
                onClick={() => onRegenerate(message.id, index)}
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
              onClick={() => onRate(message.id, true, index)}
              className={`p-1.5 rounded transition-colors ${
                message.rating === true 
                  ? 'bg-purple-600/15 text-purple-500' 
                  : `${hoverClass}`
              }`}
              title="Like"
            >
              <svg className="w-4 h-4" fill={message.rating === true ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </button>
            
            <button 
              onClick={() => onRate(message.id, false, index)}
              className={`p-1.5 rounded transition-colors ${
                message.rating === false 
                  ? 'bg-purple-600/15 text-purple-500' 
                  : `${hoverClass}`
              }`}
              title="Dislike"
            >
              <svg className="w-4 h-4" fill={message.rating === false ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {message.role === 'user' && (
        <div className={`flex-shrink-0 w-8 h-8 rounded-full ${cardClass} flex items-center justify-center`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
'use client';

import { ArrowLeft, Copy, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PNodeDetailResponse } from '@/app/types/pnode-detail';

interface Props {
  node: PNodeDetailResponse['data'];
  darkMode: boolean;
  nodeNetwork: 'devnet' | 'mainnet'
}

export default function PNodeHeader({ node, darkMode, nodeNetwork}: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(node.pubkey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusColor = 
    node.status === 'active' ? 'bg-green-500/20 text-green-400' :
    node.status === 'syncing' ? 'bg-yellow-500/20 text-yellow-400' :
    'bg-red-500/20 text-red-400';

  return (
    <div className="mb-6">
      
      {/* Node header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">{node.id}</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-mono transition-colors ${
                darkMode ? 'bg-[#111827] hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {node.pubkey.slice(0, 20)}...{node.pubkey.slice(-10)}
              {copied ? (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
              {nodeNetwork}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
              {node.status}
            </span>
            {node.private && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
                Private
              </span>
            )}
          </div>
        </div>

        {/* Score badge */}
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
          darkMode ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          <div>
            <p className="text-xs text-gray-400 mb-1">XandScore™</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{node.score?.toFixed(1)}</span>
              <span className={`text-lg font-semibold ${node.scoreBreakdown?.color}`}>
                {node.scoreBreakdown?.grade}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
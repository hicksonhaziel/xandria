'use client';

import { X, ExternalLink, Loader2, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Manager {
  address: string;
  nodes: any[];
  totalNodes: number;
  devnetNodes: number;
  mainnetNodes: number;
  activeNodes: number;
  lastRegistered: string;
}

interface NodeData {
  pubkey: string;
  id: string;
  status: string;
  network: string;
  uptime: number;
  storageCommitted: number;
  score: number;
  scoreBreakdown?: {
    grade: string;
    color: string;
  };
}

interface NFT {
  name: string;
  image: string;
  collectionName: string;
}

interface WalletData {
  nfts: NFT[];
  xandBalance: number;
  solBalance: number;
}

interface Props {
  manager: Manager | null;
  allNodes: NodeData[];
  onClose: () => void;
  darkMode: boolean;
  cardClass: string;
  borderClass: string;
  mutedClass: string;
}

const formatStorage = (bytes: number): string => {
  const tb = bytes / 1_000_000_000_000;
  const gb = bytes / 1_000_000_000;
  if (tb >= 1) return `${tb.toFixed(1)} TB`;
  return `${gb.toFixed(0)} GB`;
};

const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
};

export default function ManagerModal({
  manager,
  allNodes,
  onClose,
  darkMode,
  cardClass,
  borderClass,
  mutedClass,
}: Props) {
  const router = useRouter();
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(true);

  useEffect(() => {
    if (!manager) return;

    // Fetch wallet data from Helius
    const fetchWalletData = async () => {
      setLoadingWallet(true);
      try {
        const apiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
        
        // Use the searchAssets endpoint for better NFT discovery
        const response = await fetch(
          `https://mainnet.helius-rpc.com/?api-key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 'my-id',
              method: 'searchAssets',
              params: {
                ownerAddress: manager.address,
                tokenType: 'all',
                displayOptions: {
                  showCollectionMetadata: true,
                },
              },
            }),
          }
        );

        const data = await response.json();
        const assets = data?.result?.items || [];

        // Map all NFTs with better filtering
        const allNFTs = assets
          .filter((asset: any) => {
            // Only include NFTs (not fungible tokens)
            return asset.interface === 'V1_NFT' || 
                   asset.interface === 'ProgrammableNFT' ||
                   asset.content?.metadata?.name;
          })
          .map((asset: any) => {
            const metadata = asset.content?.metadata;
            const collectionName = asset.grouping?.find((g: any) => g.group_key === 'collection')?.group_value || 
                                   metadata?.collection?.name || 
                                   'Unknown Collection';
            
            return {
              name: metadata?.name || 'Unknown NFT',
              image: asset.content?.links?.image || 
                     asset.content?.files?.[0]?.uri || 
                     metadata?.image || '',
              collectionName,
              description: metadata?.description || '',
            };
          });

        // Filter for Xandeum-related NFTs (more lenient filtering)
        const xandeumNFTs = allNFTs.filter((nft: any) => {
          const searchText = `${nft.name} ${nft.collectionName} ${nft.description}`.toLowerCase();
          return searchText.includes('xandeum') || 
                 searchText.includes('xeno') ||
                 searchText.includes('bikuto') ||
                 searchText.includes('xand');
        });

        setWalletData({
          nfts: xandeumNFTs.length > 0 ? xandeumNFTs : allNFTs.slice(0, 20), // Show all NFTs if no Xandeum NFTs found
          xandBalance: 0,
          solBalance: 0,
        });
      } catch (error) {
        console.error('Error fetching wallet data:', error);
        setWalletData({ nfts: [], xandBalance: 0, solBalance: 0 });
      } finally {
        setLoadingWallet(false);
      }
    };

    fetchWalletData();
  }, [manager]);

  if (!manager) return null;

  // Get full node details
  const managerNodes = manager.nodes
    .map(n => allNodes.find(node => node.pubkey === n.pubkey))
    .filter(Boolean) as NodeData[];

  const handleNodeClick = (pubkey: string) => {
    router.push(`/pnodes/${pubkey}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`${cardClass} border ${borderClass} rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 border-b ${borderClass} flex items-center justify-between sticky top-0 ${cardClass} z-10`}>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold mb-1">Manager Details</h2>
            <p className={`font-mono text-sm ${mutedClass} break-all`}>
              {manager.address}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`ml-4 p-2 rounded-lg transition-colors flex-shrink-0 ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {/* Nodes Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              Registered Nodes
              <span className={`text-sm ${mutedClass} font-normal`}>
                ({managerNodes.length})
              </span>
            </h3>

            {managerNodes.length === 0 ? (
              <p className={`text-sm ${mutedClass} text-center py-8`}>
                No active nodes found for this manager
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {managerNodes.map((node) => (
                  <div
                    key={node.pubkey}
                    className={`${cardClass} border ${borderClass} rounded-lg p-4 ${
                      darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                    } transition-all cursor-pointer group`}
                    onClick={() => handleNodeClick(node.pubkey)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{node.id}</span>
                          <ExternalLink className={`w-3 h-3 ${mutedClass} group-hover:text-purple-400 transition-colors`} />
                        </div>
                        <p className={`font-mono text-xs ${mutedClass}`}>
                          {node.pubkey.slice(0, 12)}...
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${
                          node.status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : node.status === 'syncing'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {node.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className={mutedClass}>Network</p>
                        <span
                          className={`inline-block px-2 py-0.5 rounded mt-1 ${
                            node.network === 'devnet'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-purple-500/20 text-purple-400'
                          }`}
                        >
                          {node.network}
                        </span>
                      </div>
                      <div>
                        <p className={mutedClass}>Score</p>
                        <p className="font-semibold mt-1">
                          {node.score ? node.score.toFixed(1) : 'N/A'}
                          {node.scoreBreakdown && (
                            <span className={`ml-1 text-xs ${node.scoreBreakdown.color}`}>
                              {node.scoreBreakdown.grade}
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className={mutedClass}>Uptime</p>
                        <p className="font-medium mt-1">{formatUptime(node.uptime)}</p>
                      </div>
                      <div>
                        <p className={mutedClass}>Storage</p>
                        <p className="font-medium mt-1">{formatStorage(node.storageCommitted)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* NFTs Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              NFT Collection
            </h3>

            {loadingWallet ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className={`w-8 h-8 ${mutedClass} animate-spin`} />
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold">
                    Total NFTs: {walletData?.nfts.length || 0}
                  </h4>
                </div>
                {walletData?.nfts && walletData.nfts.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {walletData.nfts.map((nft, idx) => (
                      <div
                        key={idx}
                        className={`${cardClass} border ${borderClass} rounded-lg p-2 ${
                          darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                        } transition-all group`}
                      >
                        {nft.image ? (
                          <div className="relative">
                            <img
                              src={nft.image}
                              alt={nft.name}
                              className="w-full aspect-square object-cover rounded-md mb-2"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  const placeholder = document.createElement('div');
                                  placeholder.className = `w-full aspect-square ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-md mb-2 flex items-center justify-center`;
                                  placeholder.innerHTML = `<svg class="w-8 h-8 ${mutedClass}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`;
                                  parent.insertBefore(placeholder, target);
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className={`w-full aspect-square ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-md mb-2 flex items-center justify-center`}>
                            <ImageIcon className={`w-8 h-8 ${mutedClass}`} />
                          </div>
                        )}
                        <p className="text-xs font-medium truncate group-hover:text-purple-400 transition-colors" title={nft.name}>
                          {nft.name}
                        </p>
                        <p className={`text-xs ${mutedClass} truncate`} title={nft.collectionName}>
                          {nft.collectionName}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-sm ${mutedClass} text-center py-8`}>
                    No NFTs found in this wallet
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

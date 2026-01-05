import { useMemo } from 'react';
import type { PNode } from '@/app/types';

export function useFilteredPNodes(
  nodes: PNode[],
  searchTerm: string,
  filterStatus: string,
  sortBy: string
) {
  return useMemo(() => {
    // Step 0: Deduplicate nodes by pubkey (keep the one with highest storage/score)
    const uniqueNodesMap = new Map<string, PNode>();
    nodes.forEach(node => {
      const existing = uniqueNodesMap.get(node.pubkey);
      if (!existing || (node.storageCommitted > existing.storageCommitted)) {
        uniqueNodesMap.set(node.pubkey, node);
      }
    });
    const uniqueNodes = Array.from(uniqueNodesMap.values());

    // Step 1: Filter by search term and status
    const filtered = uniqueNodes.filter(node => {
      // Handle search
      const matchesSearch = !searchTerm || (() => {
        const q = searchTerm.toLowerCase();
        return (
          node.id.toLowerCase().includes(q) ||
          node.pubkey.toLowerCase().includes(q) ||
          node.ipAddress.toLowerCase().includes(q)
        );
      })();

      // Handle status filter
      const matchesFilter = filterStatus === 'all' || node.status === filterStatus;

      return matchesSearch && matchesFilter;
    });

    // Step 2: Sort the filtered results
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'score') return (b.score || 0) - (a.score || 0);
      if (sortBy === 'uptime') return (b.uptime || 0) - (a.uptime || 0);
      if (sortBy === 'storage') return (b.storageCommitted || 0) - (a.storageCommitted || 0);
      if (sortBy === 'new') return (a.uptime || 0) - (b.uptime || 0); // Newest first (lowest uptime)
      return 0;
    });

    return sorted;
  }, [nodes, searchTerm, filterStatus, sortBy]);
}
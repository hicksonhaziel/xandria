import type { PNode } from '@/app/types';

export interface PNodeDetails {
  error: null | string;
  id: number;
  jsonrpc: string;
  result: {
    active_streams: number;
    cpu_percent: number;
    current_index: number;
    file_size: number;
    last_updated: number;
    packets_received: number;
    packets_sent: number;
    ram_total: number;
    ram_used: number;
    total_bytes: number;
    total_pages: number;
    uptime: number;
  };
}

export interface NetworkComparison {
  uptimePercentile: number;
  storagePercentile: number;
  networkAverage: {
    uptime: number;
    storage: number;
  };
  totalNodes: number;
}

export interface Recommendation {
  category: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  message: string;
  action: string;
}

export interface PNodeDetailResponse {
  success: boolean;
  data: PNode & {
    private: boolean;
    details?: PNodeDetails;
    networkComparison: NetworkComparison;
    recommendations: Recommendation[];
  };
  timestamp: number;
}
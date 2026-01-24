import { useState, useEffect } from 'react';

interface ProUserNode {
  id: number;
  pubkey: string;
  pub_address: string;
  number_of_alerts: number;
  is_alert_offline: boolean;
  is_alert_credit: boolean;
  is_alert_warnings: boolean;
  is_alert_insights: boolean;
  timestamp: number;
  created_at: string;
}

interface ProUser {
  id: number;
  pub_address: string;
  number_of_nodes: number;
  telegram_chat_id: string | null;
  is_alert: boolean;
  timestamp: number;
  created_at: string;
  nodes: ProUserNode[];
  telegram_token?: string;
}

export function useProUser(publicKey: string | null) {
  const [user, setUser] = useState<ProUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrCreateUser = async () => {
    if (!publicKey) {
      setUser(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pub_address: publicKey }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch user');
      }

      setUser(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const addNode = async (nodePubkey: string) => {
    if (!publicKey) {
      throw new Error('No wallet connected');
    }

    try {
      const response = await fetch('/api/pro/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pub_address: publicKey,
          node_pubkey: nodePubkey 
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to add node');
      }

      // Refresh user data
      await fetchOrCreateUser();
      
      return data.data;
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchOrCreateUser();
  }, [publicKey]);

  return { user, loading, error, addNode, refresh: fetchOrCreateUser };
}


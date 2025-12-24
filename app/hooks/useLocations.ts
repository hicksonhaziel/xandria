// hooks/useLocations.ts
'use client';

import { useState, useEffect, useCallback } from 'react';

export interface LocationData {
  ip: string;
  countryCode: string;
  countryName: string;
  regionName: string;
  city: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  flag: string;
  cached: boolean;
  timestamp: number;
}

interface UseLocationsReturn {
  locations: Map<string, LocationData>;
  loading: boolean;
  error: string | null;
  getLocation: (ip: string) => LocationData | null;
  refreshLocation: (ip: string) => Promise<void>;
  refreshAll: () => Promise<void>;
}

/**
 * Hook to fetch and cache location data for IP addresses
 * @param ips - Array of IP addresses to fetch locations for
 * @param autoFetch - Whether to automatically fetch on mount (default: true)
 */
export function useLocations(
  ips: string[],
  autoFetch: boolean = true
): UseLocationsReturn {
  const [locations, setLocations] = useState<Map<string, LocationData>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch locations from API
  const fetchLocations = useCallback(async (ipList: string[]) => {
    if (ipList.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      // Filter unique IPs
      const uniqueIps = [...new Set(ipList)];

      // Batch request
      const response = await fetch('/api/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ips: uniqueIps }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch locations: ${response.statusText}`);
      }

      const data = await response.json();

      // Update state with new locations
      setLocations(prev => {
        const updated = new Map(prev);
        Object.entries(data.locations).forEach(([ip, location]) => {
          updated.set(ip, location as LocationData);
        });
        return updated;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch locations';
      setError(message);
      console.error('useLocations error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch on mount or when IPs change
  useEffect(() => {
    if (autoFetch && ips.length > 0) {
      // Only fetch IPs we don't already have
      const newIps = ips.filter(ip => !locations.has(ip));
      if (newIps.length > 0) {
        fetchLocations(newIps);
      }
    }
  }, [JSON.stringify(ips), autoFetch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Get a single location
  const getLocation = useCallback((ip: string): LocationData | null => {
    return locations.get(ip) || null;
  }, [locations]);

  // Refresh a single location (force refetch)
  const refreshLocation = useCallback(async (ip: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/location?ip=${encodeURIComponent(ip)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch location for ${ip}`);
      }

      const data = await response.json();

      setLocations(prev => {
        const updated = new Map(prev);
        updated.set(ip, data);
        return updated;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refresh location';
      setError(message);
      console.error('refreshLocation error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh all locations
  const refreshAll = useCallback(async () => {
    setLocations(new Map()); // Clear existing
    await fetchLocations(ips);
  }, [ips, fetchLocations]);

  return {
    locations,
    loading,
    error,
    getLocation,
    refreshLocation,
    refreshAll,
  };
}

/**
 * Hook to fetch a single location
 * @param ip - IP address to fetch location for
 */
export function useLocation(ip: string | null) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ip) {
      setLocation(null);
      return;
    }

    const fetchLocation = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/location?ip=${encodeURIComponent(ip)}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch location`);
        }

        const data = await response.json();
        setLocation(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch location';
        setError(message);
        console.error('useLocation error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, [ip]);

  return { location, loading, error };
}
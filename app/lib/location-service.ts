// lib/location-service.ts
export const runtime = "nodejs";
import { redis } from '@/app/lib/redis';

const LOCATION_CACHE_TTL = 2592000; // 30 days in seconds

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
  flag: string; // emoji flag
  cached: boolean;
  timestamp: number;
}

export class LocationService {
  // Generate flag emoji from country code
  private static getFlag(countryCode: string): string {
    if (!countryCode || countryCode.length !== 2) return '🌐';
    
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    
    return String.fromCodePoint(...codePoints);
  }

  // Fetch location from ip-api.com
  private static async fetchFromAPI(ip: string): Promise<LocationData | null> {
    try {
      const res = await fetch(
        `http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,regionName,city,lat,lon,timezone,isp`
      );
      
      if (!res.ok) return null;
      
      const data = await res.json();
      
      if (data.status !== 'success') return null;

      const locationData: LocationData = {
        ip,
        countryCode: data.countryCode || 'XX',
        countryName: data.country || 'Unknown',
        regionName: data.regionName || '',
        city: data.city || '',
        lat: data.lat || 0,
        lon: data.lon || 0,
        timezone: data.timezone || '',
        isp: data.isp || '',
        flag: this.getFlag(data.countryCode),
        cached: false,
        timestamp: Date.now(),
      };

      return locationData;
    } catch (error) {
      console.error(`Failed to fetch location for ${ip}:`, error);
      return null;
    }
  }

  // Get location with caching
  static async getLocation(ip: string): Promise<LocationData | null> {
    if (!ip || ip === 'localhost' || ip === '127.0.0.1') {
      return {
        ip,
        countryCode: 'XX',
        countryName: 'Local',
        regionName: '',
        city: '',
        lat: 0,
        lon: 0,
        timezone: '',
        isp: 'Local',
        flag: '🏠',
        cached: false,
        timestamp: Date.now(),
      };
    }

    const key = `location:${ip}`;

    try {
      // Try to get from cache first
      const cached = await redis.get(key);
      
      if (cached) {
        const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
        return { ...data, cached: true };
      }

      // Not in cache, fetch from API
      const locationData = await this.fetchFromAPI(ip);
      
      if (!locationData) return null;

      // Cache for 30 days
      await redis.set(key, JSON.stringify(locationData), { ex: LOCATION_CACHE_TTL });

      return locationData;
    } catch (error) {
      console.error(`Failed to get location for ${ip}:`, error);
      return null;
    }
  }

  // Batch get locations (useful for table loading)
  static async getLocations(ips: string[]): Promise<Map<string, LocationData>> {
    const results = new Map<string, LocationData>();
    
    // Filter unique IPs
    const uniqueIps = [...new Set(ips.filter(ip => ip && ip !== 'localhost' && ip !== '127.0.0.1'))];
    
    // Get all cached first
    const cacheKeys = uniqueIps.map(ip => `location:${ip}`);
    
    try {
      // Batch get from Redis
      const cached = await Promise.all(
        cacheKeys.map(key => redis.get(key))
      );

      const uncachedIps: string[] = [];

      // Process cached results
      cached.forEach((data, index) => {
        const ip = uniqueIps[index];
        
        if (data) {
          const parsed = typeof data === 'string' ? JSON.parse(data) : data;
          results.set(ip, { ...parsed, cached: true });
        } else {
          uncachedIps.push(ip);
        }
      });

      // Fetch uncached IPs (rate limit: 5 at a time with delay)
      for (let i = 0; i < uncachedIps.length; i += 5) {
        const batch = uncachedIps.slice(i, i + 5);
        
        await Promise.all(
          batch.map(async (ip) => {
            const location = await this.getLocation(ip);
            if (location) {
              results.set(ip, location);
            }
          })
        );

        // Rate limit: wait 1 second between batches
        if (i + 5 < uncachedIps.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return results;
    } catch (error) {
      console.error('Failed to batch get locations:', error);
      return results;
    }
  }

  // Update redis-service.ts to include this
  static async cacheLocation(ip: string, data: LocationData) {
    const key = `location:${ip}`;
    try {
      await redis.set(key, JSON.stringify(data), { ex: LOCATION_CACHE_TTL });
    } catch (error) {
      console.error('Failed to cache location:', error);
    }
  }

  // Get cached location only (no API call)
  static async getCachedLocation(ip: string): Promise<LocationData | null> {
    const key = `location:${ip}`;
    
    try {
      const data = await redis.get(key);
      if (!data) return null;
      
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      return { ...parsed, cached: true };
    } catch (error) {
      console.error('Failed to get cached location:', error);
      return null;
    }
  }

  // Clear all location cache (admin feature)
  static async clearLocationCache() {
    try {
      // Get all location keys
      const keys = await redis.keys('location:*');
      
      if (keys.length > 0) {
        await Promise.all(keys.map(key => redis.del(key)));
      }
      
      return keys.length;
    } catch (error) {
      console.error('Failed to clear location cache:', error);
      return 0;
    }
  }

  // Get cache stats
  static async getCacheStats() {
    try {
      const keys = await redis.keys('location:*');
      return {
        totalCached: keys.length,
        cacheSize: keys.length * 0.5, // Rough estimate in KB
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return { totalCached: 0, cacheSize: 0 };
    }
  }
}
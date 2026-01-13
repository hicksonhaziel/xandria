import { useState, useEffect, useCallback, useRef } from 'react'

interface NodeMetrics {
  timestamp: number
  uptime: number
  score: number
  xanScore?: number
  storageCommitted?: number
  storageUsed?: number
  storageUsagePercent?: number
  ramTotal?: number
  ramUsed?: number
  ramPercent?: number
  cpuPercent?: number
}

interface NodeHistoryResponse {
  success: boolean
  data: {
    pubkey: string
    network: 'devnet' | 'mainnet'
    history: NodeMetrics[]
    stats: {
      dataPoints: number
      timeRange: {
        start: number
        end: number
      }
      metrics: {
        uptime: {
          min: number
          max: number
          avg: number
          current: number
          previous: number
          change: number
        } | null
        score: {
          min: number
          max: number
          avg: number
          current: number
          previous: number
          change: number
        } | null
        xanScore: {
          min: number
          max: number
          avg: number
          current: number
          previous: number
          change: number
        } | null
        storagePercent: {
          min: number
          max: number
          avg: number
          current: number
          previous: number
          change: number
        } | null
      }
    }
  }
}

type TimePeriod = '10min' | '1h' | '24h' | '7d'

interface UseNodeAnalyticsOptions {
  refreshInterval?: number
  autoRefresh?: boolean
  defaultPeriod?: TimePeriod
  network?: 'devnet' | 'mainnet'
}

export function useNodeAnalytics(
  pubkey: string,
  options: UseNodeAnalyticsOptions = {}
) {
  const {
    refreshInterval = 30000,
    autoRefresh = true,
    defaultPeriod = '24h',
    network = 'devnet'
  } = options

  const [data, setData] = useState<NodeHistoryResponse['data'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<TimePeriod>(defaultPeriod)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  const fetchData = useCallback(
    async (silent = false) => {
      if (!pubkey) return

      try {
        if (!silent) {
          setLoading(true)
        } else {
          setRefreshing(true)
        }
        setError(null)

        const response = await fetch(
          `/api/analytics/node/${pubkey}?period=${period}&network=${network}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          }
        )

        if (!response.ok) {
          throw new Error('Failed to fetch analytics data')
        }

        const result: NodeHistoryResponse = await response.json()

        if (!isMountedRef.current) return

        if (result.success && result.data) {
          setData(result.data)
          setLastFetch(new Date())
        } else {
          setError('No data available')
        }
      } catch (err) {
        if (!isMountedRef.current) return
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      } finally {
        if (!isMountedRef.current) return
        setLoading(false)
        setRefreshing(false)
      }
    },
    [pubkey, period, network]
  )

  const refresh = useCallback(() => {
    fetchData(false)
  }, [fetchData])

  const changePeriod = useCallback((newPeriod: TimePeriod) => {
    setPeriod(newPeriod)
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    fetchData(false)

    return () => {
      isMountedRef.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [fetchData])

  useEffect(() => {
    if (!autoRefresh || !pubkey) return

    const scheduleNextFetch = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        fetchData(true)
        scheduleNextFetch()
      }, refreshInterval)
    }

    scheduleNextFetch()

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [autoRefresh, pubkey, refreshInterval, fetchData])

  return {
    data,
    loading,
    refreshing,
    error,
    lastFetch,
    refresh,
    period,
    changePeriod,
    network
  }
}
import { useState, useEffect, useCallback, useRef } from 'react'

interface PodCredits {
  timestamp: number
  credits: number
  podId: string
}

interface PodCreditsResponse {
  success: boolean
  data: {
    podId: string
    network: 'devnet' | 'mainnet'
    history: PodCredits[]
    stats: {
      dataPoints: number
      timeRange: {
        start: number
        end: number
      }
      credits: {
        current: number
        previous: number
        change: number
        percentChange: number
        min: number
        max: number
        avg: number
        earningRate: number
      }
      changes: {
        last10min: {
          current: number
          previous: number
          change: number
          percentChange: number
        } | null
        last7days: {
          current: number
          previous: number
          change: number
          percentChange: number
        } | null
      }
    }
  }
}

type TimePeriod = '10min' | '1h' | '24h' | '7d'

interface UsePodCreditsAnalyticsOptions {
  refreshInterval?: number
  autoRefresh?: boolean
  defaultPeriod?: TimePeriod
  network?: 'devnet' | 'mainnet'
}

export function usePodCreditsAnalytics(
  podId: string,
  options: UsePodCreditsAnalyticsOptions = {}
) {
  const {
    refreshInterval = 30000,
    autoRefresh = true,
    defaultPeriod = '24h',
    network = 'devnet'
  } = options

  const [data, setData] = useState<PodCreditsResponse['data'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<TimePeriod>(defaultPeriod)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  const fetchData = useCallback(
    async (silent = false) => {
      if (!podId) return

      try {
        if (!silent) {
          setLoading(true)
        } else {
          setRefreshing(true)
        }
        setError(null)

        const response = await fetch(
          `/api/analytics/pod/${podId}?period=${period}&network=${network}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          }
        )

        if (!response.ok) {
          throw new Error('Failed to fetch pod credits analytics')
        }

        const result: PodCreditsResponse = await response.json()

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
    [podId, period, network]
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
    if (!autoRefresh || !podId) return

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
  }, [autoRefresh, podId, refreshInterval, fetchData])

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
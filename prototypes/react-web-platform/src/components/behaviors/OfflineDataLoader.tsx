import React, { useState, useEffect, ReactNode } from 'react'
import { useOffline } from '../../lib/hooks/useOffline'

interface OfflineDataLoaderProps {
  url: string
  cacheKey: string
  fallbackData?: any
  children: (data: any, status: LoadingStatus) => ReactNode
  refreshInterval?: number
}

interface LoadingStatus {
  loading: boolean
  error: string | null
  fromCache: boolean
  isStale: boolean
  lastUpdated: Date | null
  offline: boolean
}

export function OfflineDataLoader({ 
  url, 
  cacheKey, 
  fallbackData = null, 
  children, 
  refreshInterval = 5 * 60 * 1000 // 5 minutes default
}: OfflineDataLoaderProps) {
  const { isOffline, isOnline, offlineAwareFetch, getOfflineData, saveOfflineData } = useOffline()
  
  const [data, setData] = useState<any>(fallbackData)
  const [status, setStatus] = useState<LoadingStatus>({
    loading: true,
    error: null,
    fromCache: false,
    isStale: false,
    lastUpdated: null,
    offline: isOffline
  })

  const loadData = async (forceRefresh = false) => {
    setStatus(prev => ({ ...prev, loading: true, error: null, offline: isOffline }))

    try {
      if (isOffline || forceRefresh === false) {
        // Try to get cached data first
        const cachedData = await getOfflineData(cacheKey, fallbackData)
        if (cachedData) {
          const lastUpdated = localStorage.getItem(`${cacheKey}_timestamp`)
          const timestamp = lastUpdated ? new Date(lastUpdated) : null
          const isStale = timestamp ? (Date.now() - timestamp.getTime()) > refreshInterval : true

          setData(cachedData)
          setStatus({
            loading: false,
            error: null,
            fromCache: true,
            isStale,
            lastUpdated: timestamp,
            offline: isOffline
          })

          // If online and data is stale, try to refresh in background
          if (isOnline && isStale && !forceRefresh) {
            loadFreshData()
          }
          return
        }
      }

      if (isOnline) {
        await loadFreshData()
      } else {
        // Offline and no cached data
        setStatus({
          loading: false,
          error: 'No cached data available offline',
          fromCache: false,
          isStale: false,
          lastUpdated: null,
          offline: true
        })
      }
    } catch (error) {
      console.error('Data loading error:', error)
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load data'
      }))
    }
  }

  const loadFreshData = async () => {
    try {
      const response = await offlineAwareFetch(url)
      const freshData = await response.json()
      
      // Save to cache
      saveOfflineData(cacheKey, freshData)
      localStorage.setItem(`${cacheKey}_timestamp`, new Date().toISOString())
      
      setData(freshData)
      setStatus({
        loading: false,
        error: null,
        fromCache: false,
        isStale: false,
        lastUpdated: new Date(),
        offline: false
      })
    } catch (error) {
      // If fresh load fails but we have cached data, use that
      const cachedData = await getOfflineData(cacheKey, fallbackData)
      if (cachedData) {
        setData(cachedData)
        setStatus(prev => ({
          ...prev,
          loading: false,
          error: `Using cached data: ${error instanceof Error ? error.message : 'Network error'}`,
          fromCache: true,
          isStale: true
        }))
      } else {
        throw error
      }
    }
  }

  const refreshData = () => {
    loadData(true)
  }

  useEffect(() => {
    loadData()
  }, [url, cacheKey, isOffline])

  // Auto-refresh when coming back online
  useEffect(() => {
    if (isOnline && status.fromCache) {
      loadData(true)
    }
  }, [isOnline])

  return (
    <div className="relative">
      {children(data, status)}
      
      {/* Data status indicator */}
      {(status.fromCache || status.error) && (
        <div className="absolute top-2 right-2 z-10">
          <div className={`
            px-2 py-1 rounded-full text-xs font-medium
            ${status.error && !status.fromCache
              ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
              : status.isStale
              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
              : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
            }
          `}>
            {status.error && !status.fromCache ? (
              '⚠️ Error'
            ) : status.fromCache ? (
              status.isStale ? '📱 Cached (stale)' : '📱 Cached'
            ) : (
              '🟢 Live'
            )}
          </div>
        </div>
      )}
      
      {/* Refresh button for cached/stale data */}
      {isOnline && (status.fromCache || status.error) && (
        <button
          onClick={refreshData}
          disabled={status.loading}
          className="absolute top-2 right-20 z-10 px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs rounded transition-colors"
        >
          {status.loading ? '⟳' : '↻'} Refresh
        </button>
      )}
    </div>
  )
}

// Higher-order component for offline-aware data fetching
export function withOfflineData<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  dataProps: { url: string; cacheKey: string; fallbackData?: any }
) {
  return function OfflineWrappedComponent(props: T) {
    return (
      <OfflineDataLoader {...dataProps}>
        {(data, status) => (
          <WrappedComponent 
            {...props} 
            data={data} 
            dataStatus={status}
          />
        )}
      </OfflineDataLoader>
    )
  }
}

// Simple offline status display component
export function OfflineStatus() {
  const { isOffline, isOnline, failedRequestCount, connectionType, effectiveType } = useOffline()
  
  return (
    <div className="text-sm text-muted-foreground flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${
        isOnline ? 'bg-green-500' : 'bg-red-500'
      }`}></div>
      <span>
        {isOnline ? 'Online' : 'Offline'}
        {connectionType !== 'unknown' && ` (${effectiveType})`}
      </span>
      {failedRequestCount > 0 && (
        <span className="bg-yellow-100 text-yellow-800 px-1 rounded text-xs">
          {failedRequestCount} queued
        </span>
      )}
    </div>
  )
}
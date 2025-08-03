import { useState, useEffect } from 'react'

interface OfflineStatus {
  isOnline: boolean
  isOffline: boolean
  wasOffline: boolean
  offlineDuration: number
  lastOnlineTime: Date | null
  connectionType: string
  effectiveType: string
}

interface FailedRequest {
  id: string
  url: string
  method: string
  body?: any
  headers?: Record<string, string>
  timestamp: Date
  retryCount: number
}

export function useOffline() {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: navigator.onLine,
    isOffline: !navigator.onLine,
    wasOffline: false,
    offlineDuration: 0,
    lastOnlineTime: navigator.onLine ? new Date() : null,
    connectionType: 'unknown',
    effectiveType: 'unknown'
  })

  const [failedRequests, setFailedRequests] = useState<FailedRequest[]>([])
  const [offlineStartTime, setOfflineStartTime] = useState<Date | null>(null)

  useEffect(() => {
    // Get connection information if available
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    
    const updateConnectionInfo = () => {
      if (connection) {
        setStatus(prev => ({
          ...prev,
          connectionType: connection.type || 'unknown',
          effectiveType: connection.effectiveType || 'unknown'
        }))
      }
    }

    const handleOnline = () => {
      console.log('Network: Back online')
      const now = new Date()
      const duration = offlineStartTime ? now.getTime() - offlineStartTime.getTime() : 0
      
      setStatus(prev => ({
        ...prev,
        isOnline: true,
        isOffline: false,
        wasOffline: prev.isOffline,
        offlineDuration: duration,
        lastOnlineTime: now
      }))
      
      setOfflineStartTime(null)
      
      // Retry failed requests when back online
      retryFailedRequests()
      
      updateConnectionInfo()
    }

    const handleOffline = () => {
      console.log('Network: Gone offline')
      const now = new Date()
      
      setStatus(prev => ({
        ...prev,
        isOnline: false,
        isOffline: true,
        wasOffline: false
      }))
      
      setOfflineStartTime(now)
    }

    // Initial connection info update
    updateConnectionInfo()

    // Listen for online/offline events
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Listen for connection changes
    if (connection) {
      connection.addEventListener('change', updateConnectionInfo)
    }

    // Periodic online check (fallback for unreliable events)
    const checkInterval = setInterval(() => {
      const actuallyOnline = navigator.onLine
      if (actuallyOnline !== status.isOnline) {
        if (actuallyOnline) {
          handleOnline()
        } else {
          handleOffline()
        }
      }
    }, 5000) // Check every 5 seconds

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (connection) {
        connection.removeEventListener('change', updateConnectionInfo)
      }
      clearInterval(checkInterval)
    }
  }, [status.isOnline, offlineStartTime])

  // Queue failed request for retry
  const queueFailedRequest = (url: string, options: RequestInit = {}) => {
    const failedRequest: FailedRequest = {
      id: `${Date.now()}-${Math.random()}`,
      url,
      method: options.method || 'GET',
      body: options.body,
      headers: options.headers as Record<string, string>,
      timestamp: new Date(),
      retryCount: 0
    }

    setFailedRequests(prev => [...prev, failedRequest])
    console.log('Queued failed request:', failedRequest)
  }

  // Retry all failed requests
  const retryFailedRequests = async () => {
    if (failedRequests.length === 0) return

    console.log(`Retrying ${failedRequests.length} failed requests...`)
    
    const retryPromises = failedRequests.map(async (request) => {
      try {
        const response = await fetch(request.url, {
          method: request.method,
          body: request.body,
          headers: request.headers
        })

        if (response.ok) {
          console.log('Successfully retried request:', request.url)
          return { success: true, id: request.id }
        } else {
          console.log('Retry failed for request:', request.url, response.status)
          return { success: false, id: request.id }
        }
      } catch (error) {
        console.log('Retry error for request:', request.url, error)
        return { success: false, id: request.id }
      }
    })

    const results = await Promise.all(retryPromises)
    
    // Remove successful requests, increment retry count for failed ones
    setFailedRequests(prev => 
      prev.filter(request => {
        const result = results.find(r => r.id === request.id)
        if (result?.success) {
          return false // Remove successful request
        } else {
          // Increment retry count, remove if too many retries
          request.retryCount++
          return request.retryCount < 3 // Keep if less than 3 retries
        }
      })
    )
  }

  // Enhanced fetch with offline handling
  const offlineAwareFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    if (!status.isOnline) {
      // If offline, queue the request and throw an error
      queueFailedRequest(url, options)
      throw new Error('Network request failed: Currently offline')
    }

    try {
      const response = await fetch(url, options)
      if (!response.ok && response.status >= 500) {
        // Server error, might want to queue for retry
        queueFailedRequest(url, options)
      }
      return response
    } catch (error) {
      // Network error, queue for retry
      queueFailedRequest(url, options)
      throw error
    }
  }

  // Clear failed requests manually
  const clearFailedRequests = () => {
    setFailedRequests([])
  }

  // Get offline-friendly data (from cache or fallback)
  const getOfflineData = async (key: string, fallback: any = null) => {
    try {
      // Try to get from localStorage first
      const cached = localStorage.getItem(`offline_${key}`)
      if (cached) {
        return JSON.parse(cached)
      }
      
      // Try service worker cache
      const cache = await caches.open('react-data-platform-api-v1.1.0')
      const response = await cache.match(key)
      if (response) {
        return await response.json()
      }
      
      return fallback
    } catch (error) {
      console.log('Error getting offline data:', error)
      return fallback
    }
  }

  // Save data for offline use
  const saveOfflineData = (key: string, data: any) => {
    try {
      localStorage.setItem(`offline_${key}`, JSON.stringify(data))
    } catch (error) {
      console.log('Error saving offline data:', error)
    }
  }

  return {
    ...status,
    failedRequests,
    failedRequestCount: failedRequests.length,
    queueFailedRequest,
    retryFailedRequests,
    clearFailedRequests,
    offlineAwareFetch,
    getOfflineData,
    saveOfflineData
  }
}
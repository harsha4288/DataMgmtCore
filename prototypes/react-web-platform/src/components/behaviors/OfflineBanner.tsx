import React from 'react'
import { useOffline } from '../../lib/hooks/useOffline'

export function OfflineBanner() {
  const { 
    isOffline, 
    isOnline, 
    wasOffline, 
    offlineDuration, 
    failedRequestCount,
    connectionType,
    effectiveType,
    retryFailedRequests 
  } = useOffline()

  // Don't show banner if online and never was offline
  if (isOnline && !wasOffline && failedRequestCount === 0) {
    return null
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  const getConnectionQuality = () => {
    if (effectiveType === '4g') return { text: 'Fast', color: 'text-green-600' }
    if (effectiveType === '3g') return { text: 'Good', color: 'text-yellow-600' }
    if (effectiveType === '2g') return { text: 'Slow', color: 'text-orange-600' }
    if (effectiveType === 'slow-2g') return { text: 'Very Slow', color: 'text-red-600' }
    return { text: 'Unknown', color: 'text-gray-600' }
  }

  if (isOffline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white p-3 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-300 animate-pulse"></div>
              <span className="font-medium">You are offline</span>
            </div>
            {failedRequestCount > 0 && (
              <span className="text-sm bg-red-700 px-2 py-1 rounded">
                {failedRequestCount} queued request{failedRequestCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="text-sm">
            Using cached content where available
          </div>
        </div>
      </div>
    )
  }

  if (wasOffline || failedRequestCount > 0) {
    const quality = getConnectionQuality()
    
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-green-600 text-white p-3 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-300"></div>
              <span className="font-medium">Back online</span>
            </div>
            {offlineDuration > 0 && (
              <span className="text-sm">
                Was offline for {formatDuration(offlineDuration)}
              </span>
            )}
            {failedRequestCount > 0 && (
              <button
                onClick={retryFailedRequests}
                className="text-sm bg-green-700 hover:bg-green-800 px-3 py-1 rounded transition-colors"
              >
                Retry {failedRequestCount} failed request{failedRequestCount !== 1 ? 's' : ''}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className={quality.color}>
              Connection: {quality.text}
            </span>
            {connectionType !== 'unknown' && (
              <span>({connectionType})</span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}

export function OfflineIndicator() {
  const { isOffline, isOnline, failedRequestCount, connectionType, effectiveType } = useOffline()

  if (isOnline && failedRequestCount === 0) {
    return null
  }

  return (
    <div className="fixed bottom-20 right-4 z-40">
      <div className={`
        px-3 py-2 rounded-lg shadow-lg text-sm font-medium
        ${isOffline 
          ? 'bg-red-500 text-white' 
          : 'bg-yellow-500 text-black'
        }
      `}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            isOffline ? 'bg-red-300' : 'bg-yellow-300'
          } ${isOffline ? 'animate-pulse' : ''}`}></div>
          <span>
            {isOffline ? 'Offline' : 'Limited connectivity'}
          </span>
          {failedRequestCount > 0 && (
            <span className="bg-white bg-opacity-30 px-1 rounded text-xs">
              {failedRequestCount}
            </span>
          )}
        </div>
        {connectionType !== 'unknown' && (
          <div className="text-xs opacity-75 mt-1">
            {effectiveType} ({connectionType})
          </div>
        )}
      </div>
    </div>
  )
}
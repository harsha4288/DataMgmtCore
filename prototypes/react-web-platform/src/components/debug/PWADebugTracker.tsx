import React, { useState, useEffect } from 'react'
import { usePWA } from '../../lib/hooks/usePWA'

interface CacheInfo {
  name: string
  size: number
  entries: string[]
}

interface ServiceWorkerInfo {
  state: string
  scriptURL: string
  scope: string
}

interface DebugInfo {
  timestamp: string
  pwaStatus: any
  caches: CacheInfo[]
  serviceWorker: ServiceWorkerInfo | null
  networkStatus: string
  performance: {
    loadTime: number
    cacheHitRate: number
  }
  logs: string[]
}

export function PWADebugTracker() {
  const [isOpen, setIsOpen] = useState(false)
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const pwaStatus = usePWA()

  const collectDebugInfo = async (): Promise<DebugInfo> => {
    const startTime = performance.now()
    
    // Collect cache information
    const cacheNames = await caches.keys()
    const caches_info: CacheInfo[] = []
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName)
      const keys = await cache.keys()
      caches_info.push({
        name: cacheName,
        size: keys.length,
        entries: keys.map(req => req.url).slice(0, 10) // Limit to first 10 entries
      })
    }

    // Collect service worker information
    let serviceWorkerInfo: ServiceWorkerInfo | null = null
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      const sw = navigator.serviceWorker.controller
      serviceWorkerInfo = {
        state: sw.state,
        scriptURL: sw.scriptURL,
        scope: navigator.serviceWorker.controller ? 'active' : 'none'
      }
    }

    // Collect performance metrics
    const loadTime = performance.now() - startTime
    
    // Simulate cache hit rate calculation (would need actual tracking in production)
    const cacheHitRate = caches_info.reduce((acc, cache) => acc + cache.size, 0) > 0 ? 85 : 0

    // Collect recent console logs (simulated - in real implementation you'd capture actual logs)
    const logs = [
      `[${new Date().toISOString()}] PWA Debug Info Collected`,
      `[${new Date().toISOString()}] Cache Storage: ${cacheNames.length} caches found`,
      `[${new Date().toISOString()}] Service Worker: ${serviceWorkerInfo ? 'Active' : 'Not Active'}`,
      `[${new Date().toISOString()}] Network: ${navigator.onLine ? 'Online' : 'Offline'}`
    ]

    return {
      timestamp: new Date().toISOString(),
      pwaStatus,
      caches: caches_info,
      serviceWorker: serviceWorkerInfo,
      networkStatus: navigator.onLine ? 'Online' : 'Offline',
      performance: {
        loadTime,
        cacheHitRate
      },
      logs
    }
  }

  const refreshDebugInfo = async () => {
    const info = await collectDebugInfo()
    setDebugInfo(info)
  }

  useEffect(() => {
    if (isOpen) {
      refreshDebugInfo()
    }
  }, [isOpen])

  useEffect(() => {
    if (autoRefresh && isOpen) {
      const interval = setInterval(refreshDebugInfo, 5000) // Refresh every 5 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh, isOpen])

  const exportDebugInfo = () => {
    if (!debugInfo) return
    
    const dataStr = JSON.stringify(debugInfo, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `pwa-debug-${Date.now()}.json`
    link.click()
    
    URL.revokeObjectURL(url)
  }

  const clearAllCaches = async () => {
    if (confirm('Are you sure you want to clear all caches? This will remove all cached data.')) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map(name => caches.delete(name)))
      refreshDebugInfo()
      console.log('All caches cleared')
    }
  }

  const triggerServiceWorkerUpdate = async () => {
    if (navigator.serviceWorker) {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        registration.update()
        console.log('Service Worker update triggered')
        setTimeout(refreshDebugInfo, 1000)
      }
    }
  }

  return (
    <>
      {/* Floating Debug Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200"
        title="PWA Debug Tracker"
      >
        🔧
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">PWA Debug Tracker</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`px-3 py-1 rounded text-sm ${autoRefresh ? 'bg-green-500' : 'bg-gray-500'}`}
                >
                  Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
                </button>
                <button
                  onClick={refreshDebugInfo}
                  className="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded text-sm"
                >
                  Refresh
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto max-h-[80vh]">
              {debugInfo ? (
                <div className="space-y-6">
                  {/* PWA Status */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-3">PWA Status</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>Supported: <span className={debugInfo.pwaStatus.isSupported ? 'text-green-600' : 'text-red-600'}>{debugInfo.pwaStatus.isSupported ? 'Yes' : 'No'}</span></div>
                      <div>Installed: <span className={debugInfo.pwaStatus.isInstalled ? 'text-green-600' : 'text-orange-600'}>{debugInfo.pwaStatus.isInstalled ? 'Yes' : 'No'}</span></div>
                      <div>Can Install: <span className={debugInfo.pwaStatus.canInstall ? 'text-green-600' : 'text-gray-600'}>{debugInfo.pwaStatus.canInstall ? 'Yes' : 'No'}</span></div>
                      <div>Service Worker: <span className={debugInfo.pwaStatus.serviceWorkerRegistered ? 'text-green-600' : 'text-red-600'}>{debugInfo.pwaStatus.serviceWorkerRegistered ? 'Active' : 'Inactive'}</span></div>
                    </div>
                  </div>

                  {/* Network Status */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-3">Network & Performance</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>Network: <span className={debugInfo.networkStatus === 'Online' ? 'text-green-600' : 'text-red-600'}>{debugInfo.networkStatus}</span></div>
                      <div>Cache Hit Rate: <span className="text-blue-600">{debugInfo.performance.cacheHitRate}%</span></div>
                      <div>Load Time: <span className="text-blue-600">{debugInfo.performance.loadTime.toFixed(2)}ms</span></div>
                    </div>
                  </div>

                  {/* Service Worker Details */}
                  {debugInfo.serviceWorker && (
                    <div className="border rounded-lg p-4">
                      <h3 className="font-bold text-lg mb-3">Service Worker Details</h3>
                      <div className="text-sm space-y-2">
                        <div>State: <span className="text-green-600">{debugInfo.serviceWorker.state}</span></div>
                        <div>Script URL: <span className="text-blue-600 break-all">{debugInfo.serviceWorker.scriptURL}</span></div>
                        <div>Scope: <span className="text-blue-600">{debugInfo.serviceWorker.scope}</span></div>
                      </div>
                    </div>
                  )}

                  {/* Cache Storage */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-3">Cache Storage ({debugInfo.caches.length} caches)</h3>
                    {debugInfo.caches.length > 0 ? (
                      <div className="space-y-3">
                        {debugInfo.caches.map((cache, index) => (
                          <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                            <div className="font-semibold">{cache.name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              {cache.size} entries
                            </div>
                            <div className="text-xs mt-2">
                              <details>
                                <summary className="cursor-pointer">View entries</summary>
                                <div className="mt-2 max-h-32 overflow-y-auto">
                                  {cache.entries.map((entry, i) => (
                                    <div key={i} className="break-all text-xs">{entry}</div>
                                  ))}
                                </div>
                              </details>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500">No caches found</div>
                    )}
                  </div>

                  {/* Recent Logs */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-3">Recent Logs</h3>
                    <div className="bg-black text-green-400 p-3 rounded text-xs font-mono max-h-40 overflow-y-auto">
                      {debugInfo.logs.map((log, index) => (
                        <div key={index}>{log}</div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-3">Debug Actions</h3>
                    <div className="flex gap-3 flex-wrap">
                      <button
                        onClick={exportDebugInfo}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                      >
                        Export Debug Info
                      </button>
                      <button
                        onClick={clearAllCaches}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                      >
                        Clear All Caches
                      </button>
                      <button
                        onClick={triggerServiceWorkerUpdate}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                      >
                        Update Service Worker
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    Last updated: {debugInfo.timestamp}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <div className="mt-2">Loading debug information...</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
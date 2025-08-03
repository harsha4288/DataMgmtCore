import { usePWA } from '../../lib/hooks/usePWA'
import { useOffline } from '../../lib/hooks/useOffline'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

export function PWAStatus() {
  const { isSupported, isInstalled, canInstall, serviceWorkerRegistered, installPWA } = usePWA()
  const { isOnline, isOffline, connectionType, effectiveType, failedRequestCount } = useOffline()

  if (!isSupported) {
    return (
      <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
        <div className="flex items-center gap-2">
          <Badge variant="warning" size="sm">Not Supported</Badge>
          <span className="text-sm text-orange-800 dark:text-orange-200">
            PWA features not supported in this browser
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h3 className="font-medium text-blue-900 dark:text-blue-100">PWA Status</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant={serviceWorkerRegistered ? "success" : "error"} size="sm">
              Service Worker {serviceWorkerRegistered ? "Active" : "Inactive"}
            </Badge>
            <Badge variant={isInstalled ? "success" : "info"} size="sm">
              {isInstalled ? "Installed" : "Not Installed"}
            </Badge>
            <Badge variant={isOnline ? "success" : "error"} size="sm">
              {isOnline ? "Online" : "Offline"}
            </Badge>
            {connectionType !== 'unknown' && (
              <Badge variant="info" size="sm">
                {effectiveType || connectionType}
              </Badge>
            )}
            {failedRequestCount > 0 && (
              <Badge variant="warning" size="sm">
                {failedRequestCount} queued
              </Badge>
            )}
          </div>
        </div>
        
        {canInstall && !isInstalled && (
          <Button
            onClick={installPWA}
            variant="outline"
            size="sm"
            className="text-blue-600 border-blue-300 hover:bg-blue-50"
          >
            Install App
          </Button>
        )}
      </div>
    </div>
  )
}
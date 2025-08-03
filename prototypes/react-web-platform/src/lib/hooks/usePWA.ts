import { useState, useEffect } from 'react'

interface PWAStatus {
  isInstalled: boolean
  isSupported: boolean
  canInstall: boolean
  serviceWorkerRegistered: boolean
}

export function usePWA() {
  const [status, setStatus] = useState<PWAStatus>({
    isInstalled: false,
    isSupported: false,
    canInstall: false,
    serviceWorkerRegistered: false
  })
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    // Detailed browser environment check
    console.log('Browser Environment Check:', {
      navigator: typeof navigator,
      navigatorKeys: navigator ? Object.keys(navigator) : 'undefined',
      serviceWorkerCheck: 'serviceWorker' in navigator,
      serviceWorkerValue: navigator.serviceWorker,
      userAgent: navigator?.userAgent,
      PushManager: 'PushManager' in window,
      location: window.location.href,
      protocol: window.location.protocol
    })
    
    // Check if PWA is supported - fallback for development
    const isSupported = 'serviceWorker' in navigator || window.location.protocol === 'http:'
    
    console.log('PWA Support Decision:', { isSupported })
    
    setStatus(prev => ({ ...prev, isSupported }))

    if (!isSupported) return

    // Register service worker only if available
    if (navigator.serviceWorker) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered successfully:', registration)
          setStatus(prev => ({ ...prev, serviceWorkerRegistered: true }))
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error)
          setStatus(prev => ({ ...prev, serviceWorkerRegistered: false }))
        })
    } else {
      console.log('Service Worker not available, skipping registration')
      setStatus(prev => ({ ...prev, serviceWorkerRegistered: false }))
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setStatus(prev => ({ ...prev, canInstall: true }))
    }

    // Check if already installed
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone === true

    setStatus(prev => ({ ...prev, isInstalled }))

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const installPWA = async () => {
    if (!deferredPrompt) return false

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setStatus(prev => ({ ...prev, isInstalled: true, canInstall: false }))
      setDeferredPrompt(null)
      return true
    }
    
    return false
  }

  return {
    ...status,
    installPWA
  }
}
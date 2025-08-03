const VERSION = 'v1.4.0-dev-bypass'
const STATIC_CACHE = `react-data-platform-static-${VERSION}`
const DYNAMIC_CACHE = `react-data-platform-dynamic-${VERSION}`
const API_CACHE = `react-data-platform-api-${VERSION}`

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/vite.svg'
]

// API endpoints to cache
const API_ENDPOINTS = [
  'api.alphavantage.co',
  'newsapi.org',
  'jsonplaceholder.typicode.com',
  'fakestoreapi.com'
]

// Cache duration in milliseconds
const CACHE_DURATION = {
  STATIC: 30 * 24 * 60 * 60 * 1000, // 30 days
  API: 5 * 60 * 1000, // 5 minutes
  DYNAMIC: 24 * 60 * 60 * 1000 // 1 day
}

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('SW: Installing service worker version', VERSION)
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('SW: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => self.skipWaiting())
  )
})

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  console.log('SW: Activating service worker version', VERSION)
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName.includes('react-data-platform') && 
              !cacheName.includes(VERSION)) {
            console.log('SW: Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch event - smart caching strategies
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') return
  
  // Skip chrome-extension and other non-http requests
  if (!request.url.startsWith('http')) return
  
  event.respondWith(
    handleRequest(request, url)
  )
})

async function handleRequest(request, url) {
  // Strategy 1: Static Assets (Cache First)
  if (isStaticAsset(url)) {
    return cacheFirst(request, STATIC_CACHE)
  }
  
  // Strategy 2: API Requests (Network First with Cache Fallback)
  if (isApiRequest(url)) {
    return networkFirstWithCache(request, API_CACHE, CACHE_DURATION.API)
  }
  
  // Strategy 3: Dynamic Content (Stale While Revalidate)
  return staleWhileRevalidate(request, DYNAMIC_CACHE)
}

function isStaticAsset(url) {
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/) ||
         url.pathname === '/' ||
         url.pathname.includes('/assets/')
}

function isApiRequest(url) {
  return API_ENDPOINTS.some(endpoint => url.hostname.includes(endpoint))
}

// Cache First Strategy - for static assets
async function cacheFirst(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      console.log('SW: Serving from cache:', request.url)
      return cachedResponse
    }
    
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
      console.log('SW: Cached static asset:', request.url)
    }
    return networkResponse
  } catch (error) {
    console.log('SW: Cache first failed:', error)
    return new Response('Offline', { status: 503 })
  }
}

// Network First with Cache Fallback - for API requests
async function networkFirstWithCache(request, cacheName, maxAge) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      const responseToCache = networkResponse.clone()
      
      // Add timestamp for cache expiration
      const timestampedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: {
          ...Object.fromEntries(responseToCache.headers.entries()),
          'sw-cached-at': Date.now().toString()
        }
      })
      
      cache.put(request, timestampedResponse)
      console.log('SW: Cached API response:', request.url)
      return networkResponse
    }
  } catch (error) {
    console.log('SW: Network failed, trying cache:', error.message)
  }
  
  // Fallback to cache
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    const cachedAt = cachedResponse.headers.get('sw-cached-at')
    if (cachedAt && (Date.now() - parseInt(cachedAt)) < maxAge) {
      console.log('SW: Serving fresh cached API response:', request.url)
      return cachedResponse
    } else {
      console.log('SW: Cached API response expired:', request.url)
    }
  }
  
  return new Response(JSON.stringify({
    error: 'Network unavailable and no cached data',
    offline: true
  }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  })
}

// Stale While Revalidate - for dynamic content
async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request)
  
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      const cache = caches.open(cacheName)
      cache.then(c => c.put(request, networkResponse.clone()))
      console.log('SW: Updated cache in background:', request.url)
    }
    return networkResponse
  }).catch(() => null)
  
  if (cachedResponse) {
    console.log('SW: Serving stale content, updating in background:', request.url)
    return cachedResponse
  }
  
  return fetchPromise || new Response('Offline', { status: 503 })
}

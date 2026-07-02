/*
 * Lanttusanomat service worker.
 *
 * Strategy:
 *  - Precache the app shell: home, offline fallback, manifest, icons.
 *  - HTML navigations: network-first, falling back to cache, then /offline.
 *    Every successfully fetched page is cached, so recently opened articles
 *    and the latest homepage stay readable offline.
 *  - Hashed build assets (/_next/static) and images: cache-first (immutable).
 *  - Search index: stale-while-revalidate so search works offline.
 *  - Page cache is trimmed to a maximum size (rough LRU) to bound storage.
 */

const VERSION = 'v1'
const PRECACHE = `lanttusanomat-precache-${VERSION}`
const PAGES = `lanttusanomat-pages-${VERSION}`
const ASSETS = `lanttusanomat-assets-${VERSION}`
const MAX_PAGE_ENTRIES = 60

const PRECACHE_URLS = ['/', '/offline', '/manifest.webmanifest', '/icons/icon-192.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  const keep = new Set([PRECACHE, PAGES, ASSETS])
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !keep.has(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  if (keys.length <= maxEntries) return
  // Cache keys are in insertion order; drop the oldest first.
  await Promise.all(keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key)))
}

async function handleNavigation(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(PAGES)
      await cache.put(request, response.clone())
      trimCache(PAGES, MAX_PAGE_ENTRIES)
    }
    return response
  } catch {
    const cached = (await caches.match(request)) || (await caches.match('/offline'))
    if (cached) return cached
    return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } })
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(ASSETS)
    await cache.put(request, response.clone())
  }
  return response
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request)
  const network = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(ASSETS)
        await cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => undefined)
  return cached || (await network) || new Response('Offline', { status: 503 })
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request))
    return
  }

  if (url.pathname === '/search-index.json') {
    event.respondWith(staleWhileRevalidate(request))
    return
  }

  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.webmanifest'
  ) {
    event.respondWith(cacheFirst(request))
  }
})

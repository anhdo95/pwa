const PRE_CACHE_NAME = 'static-v3'
const DYNAMIC_CACHE_NAME = 'dynamic-v3'
const STATIC_FILES = [
  '/',
  '/offline.html',
  '/src/images/main-image.jpg',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/js/material.min.js',
  '/src/js/app.js',
  '/src/js/feed.js'
]
const CDNs = [
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
]
const MAX_DYNAMIC_ITEMS = 10

self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing...', event)

  event.waitUntil(
    caches.open(PRE_CACHE_NAME)
      .then(function(cache) {
        cache.addAll(STATIC_FILES.concat(CDNs))
      })
  )
})

function trimCache(cacheName, maxItems) {
  caches.open(cacheName)
    .then(function(cache) {
      cache.keys().then(function(keys) {
        if (keys.length > maxItems) {
          cache.delete(keys[0])
            .then(trimCache(cacheName, maxItems))
        }
      })
    })
}

self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating...', event)

  event.waitUntil(
    caches.keys()
      .then(function(keys) {
        return Promise.all(keys.map(function(key) {
          if (![PRE_CACHE_NAME, DYNAMIC_CACHE_NAME].includes(key)) {
            return caches.delete(key)
          }
        }))
      })
  )
})

self.addEventListener('fetch', function(event) {
  const url = 'https://httpbin.org/get'

  // CACHE then NETWORK
  if (event.request.url === url) {
    return event.respondWith(
      caches.open(DYNAMIC_CACHE_NAME)
        .then(function(cache) {
          return fetch(event.request)
            .then(function(res) {
              trimCache(DYNAMIC_CACHE_NAME, MAX_DYNAMIC_ITEMS)
              cache.put(event.request.url, res.clone())
    
              return res
            })
        })
    )
  }

  // CACHE-ONLY
  if (STATIC_FILES.includes(event.request.url.replace(location.origin, ''))) {
    return event.respondWith(
      caches.match(event.request.url)
    )
  }

  // CACHE, fallback to NETWORK
  event.respondWith(
    caches.match(event.request)
      .then(function(res) {
        if (res) return res
        
        return fetch(event.request)
          .then(function(res) {
            return caches.open(DYNAMIC_CACHE_NAME)
              .then(function(cache) {
                trimCache(DYNAMIC_CACHE_NAME, MAX_DYNAMIC_ITEMS)
                cache.put(event.request.url, res.clone())

                return res
              })
          })
          .catch(function(error) {
            return caches.open(PRE_CACHE_NAME)
              .then(function(cache) {
                if (event.request.headers.get('accept').includes('type/html')) {
                  return cache.match('/offline.html')
                }
              })
          })
      })
  )
})

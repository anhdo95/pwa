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

self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing...', event)

  event.waitUntil(
    caches.open(PRE_CACHE_NAME)
      .then(function(cache) {
        cache.addAll(STATIC_FILES.concat(CDNs))
      })
  )
})

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

// STRATEGY: Cache then Network
self.addEventListener('fetch', function(event) {
  const url = 'https://httpbin.org/get'

  if (event.request.url === url) {
    return event.respondWith(
      caches.open(DYNAMIC_CACHE_NAME)
        .then(function(cache) {
          return fetch(event.request)
            .then(function(res) {
              cache.put(event.request.url, res.clone())
    
              return res
            })
        })
    )
  }

  if (STATIC_FILES.includes(event.request.url.replace(location.origin, ''))) {
    return event.respondWith(
      caches.match(event.request.url)
    )
  }

  event.respondWith(
    caches.match(event.request)
      .then(function(res) {
        if (res) return res
        
        return fetch(event.request)
          .then(function(res) {
            return caches.open(DYNAMIC_CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request.url, res.clone())

                return res
              })
          })
          .catch(function(error) {
            return caches.open(PRE_CACHE_NAME)
              .then(function(cache) {
                return cache.match('/offline.html')
              })
          })
      })
  )
})

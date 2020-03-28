const PRE_CACHE_NAME = 'static-v3'
const DYNAMIC_CACHE_NAME = 'dynamic'

self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing...', event)

  event.waitUntil(
    caches.open(PRE_CACHE_NAME)
      .then(function(cache) {
        cache.addAll([
          '/',
          '/offline.html',
          'https://fonts.googleapis.com/css?family=Roboto:400,700',
          'https://fonts.googleapis.com/icon?family=Material+Icons',
          'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
          '/src/images/main-image.jpg',
          '/src/css/app.css',
          '/src/css/feed.css',
          '/src/js/material.min.js',
          '/src/js/app.js',
          '/src/js/feed.js'
        ])
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

self.addEventListener('fetch', function(event) {
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
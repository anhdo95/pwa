const CACHE_NAME = 'static'

self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing...', event)

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        cache.addAll([
          '/',
          '/index.html',
          '/help/',
          '/help/index.html',
          '/favicon.ico',
          'https://fonts.googleapis.com/css?family=Roboto:400,700',
          'https://fonts.gstatic.com/s/roboto/v20/KFOmCnqEu92Fr1Mu4mxK.woff2',
          'https://fonts.googleapis.com/icon?family=Material+Icons',
          'https://fonts.gstatic.com/s/materialicons/v50/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2',
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
})

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(res) {
        if (res) return res
        
        return fetch(event.request)
      })
  )
})
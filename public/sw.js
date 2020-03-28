self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing...', event)
})

self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating...', event)
})

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(res) {
        if (res) return res
        
        console.log('event.request', event.request)
        return fetch(event.request)
      })
  )
})
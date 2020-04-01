importScripts('/src/js/idb.js')
importScripts('/src/js/database.js')

const PRE_CACHE_NAME = 'static-v1'
const DYNAMIC_CACHE_NAME = 'dynamic-v1'
const STATIC_FILES = [
  '/',
  '/offline.html',
  '/src/images/main-image.jpg',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/js/material.min.js',
  '/src/js/idb.js',
  '/src/js/app.js',
  '/src/js/feed.js'
]
const CDNs = [
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
]
const MAX_DYNAMIC_ITEMS = 100

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
  const url = 'https://pwaprogram-3c120.firebaseio.com/posts.json'

  // CACHE then NETWORK
  if (event.request.url === url) {
    return event.respondWith(
      fetch(event.request)
        .then(function(res) {
          const clonedRes = res.clone()

          database.clearPosts()
            .then(function() {
              return clonedRes.json()
            })
            .then(function(data) {
              Object.keys(data).forEach(function(key) {
                database.insertPost(data[key])
              })
            })

          return res
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

self.addEventListener('sync', function(event) {
  console.log('[Service Worker] Syncing...', event)
  
  if (event.tag === 'sync-new-posts') {
    database.getSyncPosts()
      .then(function(posts) {
        posts.forEach(function(post) {
          return fetch('https://us-central1-pwaprogram-3c120.cloudfunctions.net/storePostData', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(post)
          })
          .then(function(res) {
            if (res.ok) {
              res.json().then(function(data) {
                return database.deleteSyncPost(data.id)
              })
            }
          })
        })
      })
      .catch(function(error) {
        console.error('Error while sending data: ', error)
      })
  }
})

self.addEventListener('notificationclick', function(event) {
  const notification = event.notification
  const action = event.action

  console.log('notification', notification)

  if (action === 'confirm') {
    console.log('Confirm was chosen')
  } else {
    console.log('action', action)
    event.waitUntil(
      clients.matchAll()
        .then(function(clis) {
          const client = clis.find(function(c) {
            return c.visibilityState === 'visible'
          })

          const url = (notification.data && notification.data.url) || '/'

          if (client) {
            client.navigate(url)
            client.focus()
          } else {
            clients.openWindow(url)
          }
          
          notification.close()
        })
    )
  }
})

// This might help to collect user-analytics on the notifications
self.addEventListener('notificationclose', function(event) {
  console.log('Notification was closed', event)
})

self.addEventListener('push', function(event) {
  console.log('Push Notification received', event)

  let data = {
    title: 'New!',
    content: 'Something new happened.',
    openUrl: '/'
  }

  if (event.data) {
    data = JSON.parse(event.data.text())
  }

  const options = {
    body: data.content,
    icon: '/src/images/icons/app-icon-96x96.png',
    badge: '/src/images/icons/app-icon-96x96.png',
    data: {
      url: data.openUrl
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})
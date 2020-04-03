importScripts('workbox-sw.prod.v2.1.3.js')
importScripts('/src/js/idb.js')
importScripts('/src/js/database.js')

const workboxSW = new self.WorkboxSW();

workboxSW.router.registerRoute(/.*(?:googleapis|gstatic)\.com.*$/, 
  workboxSW.strategies.staleWhileRevalidate({
    cacheName: 'google-fonts',
    cacheExpiration: {
      maxEntries: 5,
      maxAgeSeconds: 60 * 60 * 24 * 30
    },
  })
)

workboxSW.router.registerRoute(/.*(?:firebasestorage\.googleapis)\.com.*$/, 
  workboxSW.strategies.staleWhileRevalidate({
    cacheName: 'post-images'
  })
)

workboxSW.router.registerRoute('https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css', 
  workboxSW.strategies.staleWhileRevalidate({
    cacheName: 'material-css'
  })
)

workboxSW.router.registerRoute('https://pwaprogram-3c120.firebaseio.com/posts.json', 
  async function(args) {
    const res = await fetch(args.event.request)
    const clonedRes = res.clone()
    
    await database.clearPosts()
    const data = await clonedRes.json()    

    Object.keys(data).forEach(key => database.insertPost(data[key]))

    return res
  }
)

workboxSW.router.registerRoute(function(route) {
  return route.event.request.headers.get('accept').includes('text/html')
}, async function(args) {
  try {
    const res = await caches.match(args.event.request)
    if (res) return res
          
    const [requestedRes, cache] = await Promise.all([
      fetch(args.event.request),
      caches.open('dynamic')
    ])

    cache.put(args.event.request.url, requestedRes.clone())

    return requestedRes
  } catch (error) {
    return caches.match('/offline.html')
  }
})


workboxSW.precache([
  {
    "url": "404.html",
    "revision": "0a27a4163254fc8fce870c8cc3a3f94f"
  },
  {
    "url": "favicon.ico",
    "revision": "2cab47d9e04d664d93c8d91aec59e812"
  },
  {
    "url": "index.html",
    "revision": "5c5a7e5346ca1beab8308b61c8afdb52"
  },
  {
    "url": "manifest.json",
    "revision": "8b83a50a4638a3835d78cd1307270e68"
  },
  {
    "url": "offline.html",
    "revision": "ee5beafc49a89593de1f76f807e9bd7e"
  },
  {
    "url": "service-worker.js",
    "revision": "b53d1a224dcfbf27b56d9c3a672d1226"
  },
  {
    "url": "src/css/app.css",
    "revision": "52507818ce5caa54091ad1586e053043"
  },
  {
    "url": "src/css/feed.css",
    "revision": "5b6828c0d708c7daed5ef915f635b21f"
  },
  {
    "url": "src/css/help.css",
    "revision": "1c6d81b27c9d423bece9869b07a7bd73"
  },
  {
    "url": "src/js/app.js",
    "revision": "b7590b31e4158451f21ac289eb653475"
  },
  {
    "url": "src/js/database.js",
    "revision": "6ef41b1a952e443f38c8d75ea68330a3"
  },
  {
    "url": "src/js/feed.js",
    "revision": "b9317bfbfe4676b0f9bd7a78ac87c4e4"
  },
  {
    "url": "src/js/idb.js",
    "revision": "017ced36d82bea1e08b08393361e354d"
  },
  {
    "url": "src/js/material.min.js",
    "revision": "713af0c6ce93dbbce2f00bf0a98d0541"
  },
  {
    "url": "src/js/util.js",
    "revision": "bfa993f6f8bc6cd9f8dfdde9667d2c33"
  },
  {
    "url": "sw-base.js",
    "revision": "a2212689d599eba41249588f51df7e31"
  },
  {
    "url": "sw.js",
    "revision": "27ec28b429e3b5e1bf0750e359dd6f70"
  },
  {
    "url": "workbox-sw.prod.v2.1.3.js",
    "revision": "a9890beda9e5f17e4c68f42324217941"
  },
  {
    "url": "src/images/main-image-lg.jpg",
    "revision": "31b19bffae4ea13ca0f2178ddb639403"
  },
  {
    "url": "src/images/main-image-sm.jpg",
    "revision": "c6bb733c2f39c60e3c139f814d2d14bb"
  },
  {
    "url": "src/images/main-image.jpg",
    "revision": "5c66d091b0dc200e8e89e56c589821fb"
  },
  {
    "url": "src/images/sf-boat.jpg",
    "revision": "0f282d64b0fb306daf12050e812d6a19"
  }
]);



// Synchronization
self.addEventListener('sync', function(event) {
  console.log('[Service Worker] Syncing...', event)
  
  if (event.tag === 'sync-new-posts') {
    database.getSyncPosts()
      .then(function(posts) {
        posts.forEach(function(post) {
          const formData = new FormData()
          formData.append('id', post.id)
          formData.append('title', post.title)
          formData.append('location', post.location)
          formData.append('file', post.picture, `${post.id}.png`)

          return fetch('https://us-central1-pwaprogram-3c120.cloudfunctions.net/storePostData', {
            method: 'POST',
            body: formData
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

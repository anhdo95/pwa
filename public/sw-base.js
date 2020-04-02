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


workboxSW.precache([]);



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

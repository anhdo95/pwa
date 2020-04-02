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


workboxSW.precache([]);

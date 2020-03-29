const DB_NAME = 'posts-store'

const dbPromise = idb.open(DB_NAME, 1, function(db) {
  if (db.objectStoreNames.contains('posts')) return

  db.createObjectStore('posts', { keyPath: 'id' })
})

const database = {
  insertPost(data) {
    return dbPromise.then(function(db) {
      const tx = db.transaction('posts', 'readwrite')
      const store = tx.objectStore('posts')
      
      store.put(data)

      return tx.complete
    })
  },
  
  getPosts() {
    return dbPromise.then(function(db) {
      const tx = db.transaction('posts', 'readonly')
      const store = tx.objectStore('posts')
      
      return store.getAll()
    })
  }
}
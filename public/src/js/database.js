const DB_NAME = 'posts-store'

const dbPromise = idb.open(DB_NAME, 2, function(db) {
  if (!db.objectStoreNames.contains('posts')) {
    db.createObjectStore('posts', { keyPath: 'id' })
  }

  if (!db.objectStoreNames.contains('sync-posts')) {
    db.createObjectStore('sync-posts', { keyPath: 'id' })
  }
})

const database = {
  insert(storeName, data) {
    return dbPromise.then(function(db) {
      const tx = db.transaction(storeName, 'readwrite')
      const store = tx.objectStore(storeName)
      
      store.put(data)

      return tx.complete
    })
  },

  getAll(storeName) {
    return dbPromise.then(function(db) {
      const tx = db.transaction(storeName, 'readonly')
      const store = tx.objectStore(storeName)
      
      return store.getAll()
    })
  },

  clear(storeName) {
    return dbPromise.then(function(db) {
      const tx = db.transaction(storeName, 'readwrite')
      const store = tx.objectStore(storeName)
      
      store.clear()

      return tx.complete
    })
  },

  delete(storeName, key) {
    return dbPromise.then(function(db) {
      const tx = db.transaction(storeName, 'readwrite')
      const store = tx.objectStore(storeName)
      
      store.delete(key)

      return tx.complete
    })
  },

  insertPost(data) {
    return this.insert('posts', data)
  },
  
  getPosts() {
    return this.getAll('posts')
  },

  clearPosts() {
    return this.clear('posts')
  },

  insertSyncPost(data) {
    return this.insert('sync-posts', data)
  },

  getSyncPosts() {
    return this.getAll('sync-posts')
  },

  deleteSyncPost(key) {
    return this.delete('sync-posts', key)
  }
}
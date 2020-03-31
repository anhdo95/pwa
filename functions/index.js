const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true })
const webpush = require('web-push')

const serviceAccount = require('./firebase-adminsdk-key.json');

const vapidPrivateKey = 'KNsq4LFn3bHe2ea6f8f44TXA9fN-z-Xqdho1aLOvYMw'
const vapidPublicKey = 'BBwfVEbDIbFxodxNNSFeHYy6dVjj-G4okmQypqrGxVyJWf1pxKQtkAQYzPqVPatc0swuw-_WPbxqlSxGke6tXTE'

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://pwaprogram-3c120.firebaseio.com/"
});

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.storePostData = functions.https.onRequest(function(request, response) {
 cors(request, response, function() {
   admin.database().ref('posts').push({
     id: request.body.id,
     title: request.body.title,
     location: request.body.location,
     image: request.body.image,
   })
   .then(function() {
     webpush.setVapidDetails('mailto:business@pwa.com', vapidPublicKey, vapidPrivateKey)
     return admin.database().ref('subscriptions').once('value')
   })
   .then(function(subscriptions) {
    subscriptions.forEach(function(sub) {
      const pushConfig = {
        endpoint: sub.val().endpoint,
        keys: {
          auth: sub.val().keys.auth,
          p256dh: sub.val().keys.p256dh,
        }
      }

      webpush.sendNotification(pushConfig, JSON.stringify({
        title: 'New post',
        content: 'New post added!'
      }))
      .catch(function(err) {
        console.error(err)
      })
    })

    response.status(201).json({
      message: 'Data stored',
      id: request.body.id
    })
   })
   .catch(function(err) {
     response.status(500).json({ error: err })
   })
 })
});

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true })
const webpush = require('web-push')
const fs = require("fs");
const UUID = require("uuid-v4");
const os = require("os");
const Busboy = require("busboy");
const path = require('path');

const serviceAccount = require('./firebase-adminsdk-key.json');

const gcconfig = {
  projectId: "pwaprogram-3c120",
  keyFilename: "firebase-adminsdk-key.json"
};

const gcs = require("@google-cloud/storage")(gcconfig);

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
   const uuid = UUID();
   const busboy = new Busboy({ headers: request.headers });
   // These objects will store the values (file + fields) extracted from busboy
   let upload;
   const fields = {};

   // This callback will be invoked for each file uploaded
   busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
     console.log(
       `File [${fieldname}] filename: ${filename}, encoding: ${encoding}, mimetype: ${mimetype}`
     );
     const filepath = path.join(os.tmpdir(), filename);
     upload = { file: filepath, type: mimetype };
     file.pipe(fs.createWriteStream(filepath));
   });

   // This will invoked on every field detected
   busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
     fields[fieldname] = val;
   });

   // This callback will be invoked after all uploaded files are saved.
   busboy.on("finish", () => {
     var bucket = gcs.bucket("pwaprogram-3c120.appspot.com");
     bucket.upload(
       upload.file,
       {
         uploadType: "media",
         metadata: {
           metadata: {
             contentType: upload.type,
             firebaseStorageDownloadTokens: uuid
           }
         }
       },
       function(err, uploadedFile) {
         if (!err) {
           admin
             .database()
             .ref("posts")
             .push({
               id: fields.id,
               title: fields.title,
               location: fields.location,
               image:
                 "https://firebasestorage.googleapis.com/v0/b/" +
                 bucket.name +
                 "/o/" +
                 encodeURIComponent(uploadedFile.name) +
                 "?alt=media&token=" +
                 uuid
             })
             .then(function() {
               webpush.setVapidDetails(
                 "mailto:business@pwa.com",
                 vapidPublicKey,
                 vapidPrivateKey
               );
               return admin
                 .database()
                 .ref("subscriptions")
                 .once("value");
             })
             .then(function(subscriptions) {
               subscriptions.forEach(function(sub) {
                 var pushConfig = {
                   endpoint: sub.val().endpoint,
                   keys: {
                     auth: sub.val().keys.auth,
                     p256dh: sub.val().keys.p256dh
                   }
                 };

                 webpush
                   .sendNotification(
                     pushConfig,
                     JSON.stringify({
                       title: "New Post",
                       content: "New Post added!",
                       openUrl: "/help"
                     })
                   )
                   .catch(function(err) {
                     console.log(err);
                   });
               });
               response
                 .status(201)
                 .json({ message: "Data stored", id: fields.id });
             })
             .catch(function(err) {
               response.status(500).json({ error: err });
             });
         } else {
           console.log(err);
         }
       }
     );
   });

   // The raw bytes of the upload will be in request.rawBody.  Send it to busboy, and get
   // a callback when it's finished.
   busboy.end(request.rawBody);
   // formData.parse(request, function(err, fields, files) {
   //   fs.rename(files.file.path, "/tmp/" + files.file.name);
   //   var bucket = gcs.bucket("YOUR_PROJECT_ID.appspot.com");
   // });
 })
});

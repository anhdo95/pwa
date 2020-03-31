let deferredPrompt;
const notifications = document.querySelectorAll('.enable-notifications')

window.addEventListener("DOMContentLoaded", function() {
  if (navigator.serviceWorker) {
    navigator.serviceWorker
      .register("/sw.js").then(function() {
        console.log("Service worker registered");
      });
  }

  window.addEventListener("beforeinstallprompt", e => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
  });

  if (Notification && navigator.serviceWorker) {
    function displayConfirmNotification() {
      const options = {
        body: 'You successfully subscribed our Notification service!',
        icon: '/src/images/icons/app-icon-96x96.png',
        dir: 'ltr',
        lang: 'vi-VN',
        vibrate: [50, 20, 100],
        badge: '/src/images/icons/app-icon-96x96.png',
        tag: 'confirm-notification',
        renotify: true,
        actions: [
          { action: 'confirm', title: 'Okay', icon: '/src/images/icons/app-icon-96x96.png' },
          { action: 'cancel', title: 'Cancel', icon: '/src/images/icons/app-icon-96x96.png' },
        ]
      }

      navigator.serviceWorker.ready
        .then(function (swReg) {
          swReg.showNotification('Successfully subscribed!', options)
        }) 
    }

    function configurePushSubscription() {
      navigator.serviceWorker.ready
        .then(function (swReg) {
          return swReg.pushManager.getSubscription()
            .then(function(sub) {
              if (!sub) {
                // Create a new subscription
                const vapidPublicKey = 'BBwfVEbDIbFxodxNNSFeHYy6dVjj-G4okmQypqrGxVyJWf1pxKQtkAQYzPqVPatc0swuw-_WPbxqlSxGke6tXTE'
                const convertedPublicKey = util.urlBase64ToUint8Array(vapidPublicKey)

                return swReg.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: convertedPublicKey
                })
              }
            })
            .then(function(sub) {
              return fetch('https://pwaprogram-3c120.firebaseio.com/subscriptions.json', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                },
                body: JSON.stringify(sub)
              })
            })
            .then(function(res) {
              if (res.ok) {
                displayConfirmNotification()
              }
            })
        })
    }

    function askForNotificationPermission() {
      Notification.requestPermission(function(result) {
        if (result !== 'granted') {
          console.log('No notification permission granted.')
        } else {
          configurePushSubscription()
          // displayConfirmNotification()
        }
      })
    }
  
    notifications.forEach(function (notification) {
      notification.style.display = 'inline-block'
      notification.addEventListener('click', askForNotificationPermission)
    })
  }

});

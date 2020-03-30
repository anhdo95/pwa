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

  if (Notification) {
    function displayConfirmNotification() {
      const options = {
        body: 'You successfully subscribed our Notification service!'
      }
      new Notification('Successfully subscribed!', options)
    }

    function askForNotificationPermission() {
      Notification.requestPermission(function(result) {
        if (result !== 'granted') {
          console.log('No notification permission granted.')
        } else {
          displayConfirmNotification()
        }
      })
    }
  
    notifications.forEach(function (notification) {
      notification.style.display = 'inline-block'
      notification.addEventListener('click', askForNotificationPermission)
    })
  }

});

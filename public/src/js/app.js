window.addEventListener('DOMContentLoaded', function() {
  if (navigator.serviceWorker) {
    navigator.serviceWorker
      .register('/sw.js')
      .then(function() {
        console.log('Service worker registered')
      })
  }
  
  (function() {
    let deferredPrompt
  
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      deferredPrompt = e;
      // Update UI notify the user they can install the PWA
      showInstallPromotion();
    });
  
    function handleInstalltion(event) {
      deferredPrompt.prompt();
  
      hideMyInstallPromotion()
  
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }

      })
      
      deferredPrompt = null
    }
    
    const container = document.querySelector('.offline-installation');
    const installButton = document.querySelector('.offline-installation__action');
    
    function showInstallPromotion() {
      installButton.addEventListener('click', handleInstalltion)
      container.classList.add('offline-installation--active')
      
  
      setTimeout(function() {
        installButton.removeEventListener('click', handleInstalltion)
        container.classList.remove('offline-installation--active')
      }, 5000)
    }
  
    function hideMyInstallPromotion() {
      installButton.removeEventListener('click', handleInstalltion)
      container.classList.remove('offline-installation--active')
    }
  })()
})

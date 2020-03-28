let deferredPrompt;

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
});

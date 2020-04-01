var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');
var form = document.querySelector('form');
var titleInput = document.querySelector('#title');
var locationInput = document.querySelector('#location');
var videoPlayer = document.querySelector('#player');
var canvasElement = document.querySelector('#canvas');
var captureButton = document.querySelector('#capture-btn');
var imagePickerArea = document.querySelector('#pick-image');
var imagePicker = document.querySelector('#image-picker');

function initializeMedia() {
  if (!navigator.mediaDevices) {
    navigator.mediaDevices = {}
  }

  if (!navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia = function(constraints) {
      const getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia

      if (!getUserMedia) return Promise.reject('getUserMedia is not implemented')

      return new Promise(function(resolve, reject) {
        return getUserMedia.call(navigator, constraints, resolve, reject)
      })
    }
  }

  navigator.mediaDevices.getUserMedia({ video: true })
    .then(function(stream) {
      videoPlayer.srcObject = stream
      videoPlayer.style.display = 'block'
    })
    .catch(function(err) {
      imagePickerArea.style.display = 'block'
    })
}

function openCreatePostModal() {
  createPostArea.style.display = 'block';
  initializeMedia()

  if (deferredPrompt) {
    deferredPrompt.prompt()

    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
    })

    deferredPrompt = null
  }
}

function closeCreatePostModal() {
  createPostArea.style.display = 'none';
  videoPlayer.style.display = 'none';
  canvasElement.style.display = 'none';
  imagePickerArea.style.display = 'none';
}

function clearCards() {
  while (sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild)
  }
}

// function saveCard(event) {
//   if (caches) {
//     caches.open('user-requested')
//       .then(function(cache) {
//         cache.addAll([
//           'https://httpbin.org/get',
//           '/src/images/sf-boat.jpg'
//         ])
//       })
//   }
// }

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

function createCard(post) {
  var cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  var cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = `url("${post.image}")`;
  cardTitle.style.backgroundSize = 'cover';
  cardTitle.style.height = '180px';
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = post.title;
  cardTitleTextElement.style.color = 'black';
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = post.location;
  cardSupportingText.style.textAlign = 'center';
  // var cardSaveButton = document.createElement('button');
  // cardSaveButton.textContent = 'Save';
  // cardSaveButton.addEventListener('click', saveCard)
  // cardSupportingText.appendChild(cardSaveButton)
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(posts) {
  clearCards()

  posts.forEach(function(post) {
    createCard(post)
  })
}

function convertObjectToArray(object) {
  return Object.keys(object).map(function(key) {
    return object[key]
  })
}

function createPost(post) {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(post)
  })
  .then(function(res) {
    console.log('res', res)
    return res
  })
}


const url = 'https://pwaprogram-3c120.firebaseio.com/posts.json'

function getPosts() {
  let networkDataReceived = false

  fetch(url)
    .then(function(res) {
      return res.json();
    })
    .then(function(data) {
        networkDataReceived = true
        console.log('From web')

        updateUI(convertObjectToArray(data))
    });

  if (indexedDB) {
    database.getPosts()
      .then(function(posts) {
        if (!posts || !posts.length || networkDataReceived) return

        console.log('From cache')
        updateUI(posts)
      })
  }
}

getPosts()

form.addEventListener('submit', function(event) {
  event.preventDefault()

  if (!titleInput.value.trim() || !locationInput.value.trim()) {
    alert('Please enter valid data')
    return
  }

  closeCreatePostModal()

  const post = {
    id: Date.now(),
    title: titleInput.value.trim(),
    location: locationInput.value.trim(),
    image: 'https://firebasestorage.googleapis.com/v0/b/pwaprogram-3c120.appspot.com/o/sf-boat.jpg?alt=media&token=59325e5d-de4f-4b47-b39c-643c7b56a0ca'
  }

  if (navigator.serviceWorker && SyncManager) {
    navigator.serviceWorker.ready
      .then(function(sw) {
        return database.insertSyncPost(post)
          .then(function() {
            return sw.sync.register('sync-new-posts')
          })
      })
      .then(function() {
        const snackbarContainer = document.getElementById('confirmation-toast')
        const data = {
          message: 'Your post was saved for syncing.',
          timeout: 4000,
        }
        snackbarContainer.MaterialSnackbar.showSnackbar(data);
      })
  } else {
    createPost(post)
      .then(function() {
        getPosts()
      })
  }
})

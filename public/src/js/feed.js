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
var picture

async function initializeMedia() {
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

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    videoPlayer.srcObject = stream
    videoPlayer.style.display = 'block'
  } catch (error) {
    imagePickerArea.style.display = 'block'
  }
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

captureButton.addEventListener('click', function(event) {
  canvasElement.style.display = 'block'
  captureButton.style.display = 'none'
  
  const context = canvasElement.getContext('2d')
  context.drawImage(videoPlayer, 0, 0, canvasElement.width, canvasElement.height)
  
  videoPlayer.style.display = 'none'
  videoPlayer.srcObject.getVideoTracks().forEach(function(track) {
    track.stop()
  })

  picture = util.dataURItoBlob(canvasElement.toDataURL())
})

imagePicker.addEventListener('change', event => {
  picture = event.target.files[0]
})

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
  const formData = new FormData()
  formData.append('id', post.id)
  formData.append('title', post.title)
  formData.append('location', post.location)
  formData.append('file', post.picture, `${post.id}.png`)

  return fetch(url, {
    method: 'POST',
    body: formData
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
      if (!data) return

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
    picture
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

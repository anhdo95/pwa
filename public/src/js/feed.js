var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');

function openCreatePostModal() {
  createPostArea.style.display = 'block';

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


const url = 'https://pwaprogram-3c120.firebaseio.com/posts.json'
let networkDataReceived = false

fetch(url, {
  mode: 'cors'
})
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

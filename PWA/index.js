// Import socket.io and initialize connection
const socket = io('http://localhost:9000');

// Connect to the socket.io server
socket.on('connect', () => {
  console.log('Povezava na socket.io strežnik vzpostavljena');
});

socket.on('productAdded', (data) => {
  console.log('Izdelek dodan:', data);
});

socket.on('oldProductAdded', (data) => {
  console.log('Izdelek dodan:', data);
});

socket.on('productDeleted', (data) => {
  console.log('Izdelek izbrisan:', data);
});

function logout() {
  localStorage.removeItem('accessToken');
  window.location.href = 'login.html';
}

function goToProfile() {
  window.location.href = 'profile.html';
}

function showInfo() {
  document.getElementById('info-modal').style.display = 'block';
}

function closeInfo() {
  document.getElementById('info-modal').style.display = 'none';
}

function displayInfoMessage() {
  document.getElementById('info-btn').title = 'Pomembne informacije';
}

function hideInfoMessage() {
  document.getElementById('info-btn').title = '';
}

function showProductModal(listId) {
  document.getElementById('product-modal').style.display = 'block';
  document.getElementById('product-form').dataset.listId = listId;
  displayExistingProducts(userId, listId);
}

function closeProductModal() {
  document.getElementById('product-modal').style.display = 'none';
}

function closeEmailModal() {
  const modal = document.getElementById('email-modal');
  modal.style.display = 'none';
}

window.onclick = function(event) {
  var modal = document.getElementById('info-modal');
  if (event.target == modal) {
    modal.style.display = 'none';
  }

  var productModal = document.getElementById('product-modal');
  if (event.target == productModal) {
    productModal.style.display = 'none';
  }
}

document.addEventListener('keydown', function(event) {
  if (event.altKey && event.key === 's') {
    document.getElementById('search').focus();
  }
});

document.addEventListener('keydown', function(event) {
  if (event.altKey && event.key === 'l') {
    logout();
  }
});

const apiUrl = 'http://localhost:5000/api/shopping-lists';
const accessToken = localStorage.getItem('accessToken');
const refreshToken = localStorage.getItem('refreshToken');
const userId = localStorage.getItem('userId');

let shoppingLists = [];
console.log(accessToken);
console.log(userId);

// Function for synchronizing data
async function synchronizeData() {
  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      console.error('Napaka pri sinhronizaciji podatkov:', response.status);
      return;
    }

    const syncedShoppingLists = await response.json();
    shoppingLists = syncedShoppingLists;
    displayShoppingLists();

    // Show a message for successful data synchronization
    showNotification('Podatki so bili uspešno sinhronizirani.');
  } catch (error) {
    console.error('Napaka pri sinhronizaciji podatkov:', error);
  }
}

async function shareList(event) {
  event.preventDefault();

  const email = document.getElementById('share-email').value;
  const listId = document.getElementById('share-list-form').dataset.listId;

  try {
    // Get the user ID based on email
    const userResponse = await fetch(`http://localhost:3000/api/users/email/${email}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!userResponse.ok) {
      console.error('Napaka pri pridobivanju uporabnika:', userResponse.status);
      return;
    }

    const userData = await userResponse.json();
    const userId = userData._id;

    // Update the shopping list for sharing
    const shareResponse = await fetch(`http://localhost:5000/api/shopping-lists/${listId}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ userId })
    });

    if (!shareResponse.ok) {
      console.error('Napaka pri deljenju seznama:', shareResponse.status);
      return;
    }

    closeShareModal();
    displayShoppingLists();

  } catch (error) {
    console.error('Napaka pri deljenju seznama:', error);
  }
}

function showShareModal(listId) {
  document.getElementById('share-list-form').dataset.listId = listId;
  document.getElementById('share-list-modal').style.display = 'block';
}

function closeShareModal() {
  document.getElementById('share-list-modal').style.display = 'none';
  document.getElementById('share-email').value = '';
}

async function displayShoppingLists() {
  const shoppingListsContainer = document.getElementById('shopping-lists-container');
  shoppingListsContainer.innerHTML = '';

  try {
    const response = await fetch('http://localhost:5000/api/shopping-lists', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      console.error('Napaka pri pridobivanju nakupovalnih seznamov:', response.status);
      return;
    }

    const shoppingLists = await response.json();

    for (const list of shoppingLists) {
      const card = document.createElement('div');
      card.classList.add('shopping-list-card');

      const createdAt = new Date(list.createdAt);
      const formattedDate = createdAt.toLocaleDateString();
      const formattedTime = createdAt.toLocaleTimeString();

      card.innerHTML = `
        <div id="list-name-${list._id}" style="display: flex; align-items: center;">
          <h3 style="text-transform: uppercase; margin-right: 8px;">${list.name}</h3>
          <button onclick="editListName('${list._id}', '${list.name}')" class="edit-btn"></button>
        </div>
        <p style="font-size: 12px; color: #b56f07">Ustvarjeno: ${formattedDate} ob ${formattedTime}</p>
      `;

      const productsResponse = await fetch(`http://localhost:5000/api/shopping-lists/${list._id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!productsResponse.ok) {
        console.error('Napaka pri pridobivanju izdelkov:', productsResponse.status);
        continue;
      }

      const productsData = await productsResponse.json();

      if (productsData.products.length > 0) {
        const itemsList = document.createElement('ul');
        let totalPrice = 0;

        productsData.products.forEach(item => {
          const listItem = document.createElement('li');

          let formattedPrice;
          if (typeof item.price === 'number') {
            formattedPrice = item.price.toFixed(2);
            totalPrice += item.price;
          } else {
            formattedPrice = 'N/A';
          }

          listItem.innerHTML = `
            <li>
              <span class="item-details"><b style="color: #5a7d0a">${item.name}</b> - ${formattedPrice} € (${item.category}, ${item.brand})</span>
              <button onclick="deleteProduct('${list._id}', '${item._id}')" class="delete-btn" style="background-image: url('assets/X.png'); background-size: cover; height: 12px; width: auto"></button>                
            </li>
          `;
          itemsList.appendChild(listItem);
        });

        card.appendChild(itemsList);

        const hrElement = document.createElement('hr');
        hrElement.style.borderTop = '1px solid #719c0e';
        card.appendChild(hrElement);

        const totalElement = document.createElement('p');
        totalElement.innerHTML = `<strong style="color: #5a7c0b;">Skupna vrednost:</strong> <span class="item-details">${totalPrice.toFixed(2)} €</span>`;
        card.appendChild(totalElement);
      } else {
        card.innerHTML += "<p>Ni izdelkov na seznamu.</p>";
      }

      card.innerHTML += `
        <button onclick="showProductModal('${list._id}')" class="button-style">Dodaj izdelek</button>
        <button onclick="deleteList('${list._id}')" class="button-style">Izbriši seznam</button>
        <button onclick="sendShoppingList('${list._id}')" class="button-style">
          Pošlji
          <img src="assets/email.png" alt="Pošlji" style="width: 14px;" class="img-button">
        </button>
        <button onclick="showShareModal('${list._id}')" class="button-style">
          Deli
          <img src="assets/share.png" alt="Deli" style="width: 12px;" class="img-button">
        </button>`;

      shoppingListsContainer.appendChild(card);
    }
  } catch (error) {
    console.error('Napaka pri prikazu izdelkov:', error);
  }
}

// Listen to socket.io events for shopping list updates
socket.on('shoppingListUpdated', (updatedList) => {
  // Update the list with new data
  const listIndex = shoppingLists.findIndex(list => list._id === updatedList._id);
  if (listIndex !== -1) {
    shoppingLists[listIndex] = updatedList;
  } else {
    shoppingLists.push(updatedList);
  }
  displayShoppingLists();
});

socket.on('shoppingListDeleted', (listId) => {
  // Remove the list from local state
  shoppingLists = shoppingLists.filter(list => list._id !== listId);
  displayShoppingLists();
});

function editListName(listId, currentName) {
  const listNameDiv = document.getElementById(`list-name-${listId}`);
  listNameDiv.innerHTML = `
    <input type="text" id="edit-name-input-${listId}" value="${currentName}" style="text-transform: uppercase; margin-right: 8px; margin-top: 10px" class="input-style">
    <button onclick="saveListName('${listId}')"  class="button-style" style="margin-top: 10px">Shrani</button>
  `;
}

async function saveListName(listId) {
  const newName = document.getElementById(`edit-name-input-${listId}`).value;

  try {
    const response = await fetch(`http://localhost:5000/api/shopping-lists/${listId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ name: newName })
    });

    if (!response.ok) {
      console.error('Napaka pri posodabljanju imena nakupovalnega seznama:', response.status);
      return;
    }

    const updatedList = await response.json();

    // Update the name display in the card
    const listNameDiv = document.getElementById(`list-name-${listId}`);
    listNameDiv.innerHTML = `
      <h3 style="text-transform: uppercase; margin-right: 8px;">${updatedList.name}</h3>
      <button onclick="editListName('${listId}', '${updatedList.name}')" class="edit-btn" style="background-image: url('assets/edit.png'); background-size: cover; height: 20px; width: 20px; border: none;"></button>
    `;
  } catch (error) {
    console.error('Napaka pri posodabljanju imena nakupovalnega seznama:', error);
  }
}

async function deleteProduct(listId, productId) {
  try {
    const response = await fetch(`http://localhost:5000/api/shopping-lists/${listId}/products/${productId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      console.error('Napaka pri brisanju izdelka:', response.status);
      return;
    }

    const updatedShoppingList = await response.json();
    shoppingLists = shoppingLists.map(list => {
      if (list._id === listId) {
        list.products = updatedShoppingList.products;
      }
      return list;
    });

    // After successfully deleting the product, send an update via socket.io
    socket.emit('productDeleted', { listId, productId });

    displayShoppingLists();
  } catch (error) {
    console.error('Napaka pri brisanju izdelka:', error);
  }

  showNotification('Izdelek je bil uspešno izbrisan iz nakupovalnega seznama.');
}

if (localStorage.getItem('shoppingLists')) {
  shoppingLists = JSON.parse(localStorage.getItem('shoppingLists'));
  displayShoppingLists();
} else {
  synchronizeData();
}

window.addEventListener('online', synchronizeData);

async function addShoppingList(event) {
  event.preventDefault();

  const listName = document.getElementById('list-name').value;

  if (!listName) {
    alert('Prosim, vnesite ime nakupovalnega seznama.');
    return;
  }

  const shoppingList = {
    name: listName
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(shoppingList)
    });

    if (!response.ok) {
      console.error('Napaka pri dodajanju nakupovalnega seznama:', response.status);
      return;
    }

    const addedList = await response.json();
    shoppingLists.push(addedList);
    localStorage.setItem('shoppingLists', JSON.stringify(shoppingLists));
    displayShoppingLists();

    document.getElementById('list-name').value = '';
  } catch (error) {
    console.error('Napaka pri dodajanju nakupovalnega seznama:', error);
  }
}

async function deleteList(id) {
  try {
    const response = await fetch(`http://localhost:5000/api/shopping-lists/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      console.error('Napaka pri brisanju nakupovalnega seznama:', response.status);
      return;
    }

    shoppingLists = shoppingLists.filter(list => list._id !== id);
    localStorage.setItem('shoppingLists', JSON.stringify(shoppingLists));
    displayShoppingLists();
  } catch (error) {
    console.error('Napaka pri brisanju nakupovalnega seznama:', error);
  }
}

document.getElementById('shopping-list-form').addEventListener('submit', addShoppingList);

// Function to add products
async function addProduct(event) {
  event.preventDefault();

  const listId = document.getElementById('product-form').dataset.listId;
  const productName = document.getElementById('product-name').value;
  const productPrice = document.getElementById('product-price').value;
  const productCategory = document.getElementById('product-category').value;
  const productBrand = document.getElementById('product-brand').value;

  const productData = {
    name: productName,
    price: parseFloat(productPrice),
    category: productCategory,
    brand: productBrand
  };

  try {
    const response = await fetch(`http://localhost:5000/api/shopping-lists/${listId}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(productData)
    });

    if (!response.ok) {
      console.error('Napaka pri dodajanju izdelka:', response.status);
      return;
    }

    const addedProduct = await response.json();
    closeProductModal();

    // After successfully adding the product, send an update via socket.io
    socket.emit('productAdded', { listId, product: addedProduct });

    displayShoppingLists();

    // Clear fields after successfully adding the product
    document.getElementById('product-name').value = '';
    document.getElementById('product-price').value = '';
    document.getElementById('product-category').value = '';
    document.getElementById('product-brand').value = '';
  } catch (error) {
    console.error('Napaka pri dodajanju izdelka:', error);
  }
  showNotification('Izdelek je bil uspešno dodan na nakupovalni seznam.');
}

async function addProductToList(product, listId) {
  try {
    const response = await fetch(`http://localhost:5000/api/shopping-lists/${listId}/products/${product._id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(product)
    });

    if (!response.ok) {
      console.error('Napaka pri dodajanju izdelka na seznam:', response.status, response.statusText);
      return;
    }

    const updatedProduct = await response.json();

    // Update the product list in client memory
    let listFound = false;
    shoppingLists.forEach(list => {
      if (list._id === listId) {
        if (!list.products) {
          list.products = [];
        }
        list.products.push(updatedProduct);
        listFound = true;
      }
    });

    if (!listFound) {
      console.error(`Seznam z ID ${listId} ni najden.`);
      return;
    }

    socket.emit('oldProductAdded', { listId, product: updatedProduct });

    closeProductModal();
    displayShoppingLists();
  } catch (error) {
    console.error('Napaka pri dodajanju izdelka na seznam:', error);
  }
  showNotification('Izdelek je bil uspešno dodan na nakupovalni seznam.');
}

// Function to display the product editing modal
async function showEditProductModal(product, listId) {
  document.getElementById('edit-product-modal').style.display = 'block';
  document.getElementById('edit-product-form').dataset.productId = product._id;
  document.getElementById('edit-product-form').dataset.listId = listId;

  // Pre-fill input fields with existing product data
  document.getElementById('edit-product-name').value = product.name;
  document.getElementById('edit-product-price').value = product.price;
  document.getElementById('edit-product-category').value = product.category;
  document.getElementById('edit-product-brand').value = product.brand;
}

function closeEditProductModal() {
  document.getElementById('edit-product-modal').style.display = 'none';
}

// Function to update products
document.getElementById('edit-product-form').addEventListener('submit', async function(event) {
  event.preventDefault();

  const productId = this.dataset.productId;
  const listId = this.dataset.listId;
  const updatedProduct = {
    name: document.getElementById('edit-product-name').value,
    price: parseFloat(document.getElementById('edit-product-price').value),
    category: document.getElementById('edit-product-category').value,
    brand: document.getElementById('edit-product-brand').value
  };

  try {
    const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(updatedProduct)
    });

    if (!response.ok) {
      console.error('Napaka pri posodabljanju izdelka:', response.status);
      return;
    }

    const updatedProductData = await response.json();
    closeEditProductModal();
    // Update the display of products on this list after successfully updating the product
    displayExistingProducts(userId, listId);
    displayShoppingLists();
  } catch (error) {
    console.error('Napaka pri posodabljanju izdelka:', error);
  }

  showNotification('Izdelek je bil uspešno posodobljen.');
});

async function displayExistingProducts(userId, listId) {
  try {
    const response = await fetch(`http://localhost:5000/api/users/${userId}/products`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      console.error('Napaka pri pridobivanju izdelkov uporabnika:', response.status);
      return;
    }

    const userProducts = await response.json();
    const productContainer = document.getElementById('existing-products-container');
    productContainer.innerHTML = '';

    if (userProducts.length > 0) {
      userProducts.forEach(item => {
        const productItem = document.createElement('div');
        productItem.classList.add('existing-product-item');
        productItem.innerHTML = `${item.name} - ${item.price.toFixed(2)} € (${item.category}, ${item.brand})`;

        const addButton = document.createElement('button');
        addButton.textContent = 'Dodaj';
        addButton.classList.add('add-button');
        addButton.addEventListener('click', function() {
          addProductToList(item, listId);
        });

        const editButton = document.createElement('button');
        editButton.innerHTML = '<img src="assets/edit.png" alt="Edit">';
        editButton.classList.add('edit-button');
        editButton.addEventListener('click', function() {
          showEditProductModal(item, listId);
        });

        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '<img src="assets/delete.png" alt="Delete">';
        deleteButton.classList.add('delete-button');
        deleteButton.addEventListener('click', function() {
          confirmDeleteProduct(userId, listId, item._id);
        });

        productItem.appendChild(addButton);
        productItem.appendChild(editButton);
        productItem.appendChild(deleteButton);

        productContainer.appendChild(productItem);
      });
    } else {
      productContainer.innerHTML = "<p>Ni obstoječih izdelkov.</p>";
    }
  } catch (error) {
    console.error('Napaka pri prikazu obstoječih izdelkov uporabnika:', error);
  }
}

function confirmDeleteProduct(userId, listId, productId) {
  const confirmationModal = document.getElementById('confirmation-modal');
  confirmationModal.style.display = 'block';

  const confirmButton = document.getElementById('confirm-delete-btn');
  confirmButton.onclick = function() {
    deleteProductFromList(userId, listId, productId);
    confirmationModal.style.display = 'none';
  };

  const cancelButton = document.getElementById('cancel-delete-btn');
  cancelButton.onclick = function() {
    confirmationModal.style.display = 'none';
  };
}

async function deleteProductFromList(userId, listId, productId) {
  deleteProduct(listId, productId);

  try {
    const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      console.error('Napaka pri brisanju izdelka iz seznama:', response.status);
      return;
    }

    // Update the list of products in client-side memory
    shoppingLists.forEach(list => {
      if (list._id === listId) {
        list.products = list.products.filter(product => product._id !== productId);
      }
    });

    // Re-display shopping lists after successful deletion
    displayShoppingLists();
    displayExistingProducts(userId, listId);
  } catch (error) {
    console.error('Napaka pri brisanju izdelka iz seznama:', error);
  }
  showNotification('Izdelek je bil uspešno izbrisan.');
}

document.getElementById('product-form').addEventListener('submit', addProduct);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('service-worker.js').then(function(registration) {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, function(err) {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

async function sendShoppingList(listId) {
  try {
    // Get the modal window for entering email address
    const modal = document.getElementById('email-modal');
    modal.style.display = 'block';

    // Form for entering email address
    const emailForm = document.getElementById('email-form');

    // Function to handle form submission
    const handleSubmit = async function(event) {
      event.preventDefault();

      // Get the email address from the input
      const recipientEmail = document.getElementById('recipient-email').value;

      // Get JWT from localStorage
      const accessToken = localStorage.getItem('accessToken');

      // Create an object with shopping list data
      const shoppingListData = {
        to: recipientEmail
      };

      try {
        // Send shopping list data via POST request with JWT
        const response = await fetch(`http://localhost:5000/api/send-shopping-list/${listId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(shoppingListData)
        });

        if (!response.ok) {
          throw new Error(`Napaka pri pošiljanju nakupovalnega seznama: ${response.status}`);
        }

        // Hide the modal window for entering email address
        modal.style.display = 'none';

        // Reset the form
        emailForm.reset();

        // Notification of successful sending of the shopping list
        alert('Nakupovalni seznam je bil uspešno poslan na e-poštni naslov ' + recipientEmail);
      } catch (error) {
        console.error('Napaka pri pošiljanju nakupovalnega seznama:', error);
      }
    };

    // Listen for the form submit event
    emailForm.addEventListener('submit', handleSubmit);
  } catch (error) {
    console.error('Napaka pri inicializaciji pošiljanja nakupovalnega seznama:', error);
  }
}

// Add an 'input' event listener to the search field
document.getElementById('search').addEventListener('input', search);

// Search function
function search() {
  // Get the value of the search field
  const searchText = document.getElementById('search').value.toLowerCase();

  // Get all shopping list cards
  const shoppingListCards = document.querySelectorAll('.shopping-list-card');

  // Iterate through all shopping list cards
  shoppingListCards.forEach(card => {
    // Get the shopping list name from the card
    const listName = card.querySelector('h3').textContent.toLowerCase();

    // Check if the shopping list name contains the search text
    if (listName.includes(searchText)) {
      // If it contains, show the card
      card.style.display = 'block';
    } else {
      // If it does not contain, hide the card
      card.style.display = 'none';
    }
  });
}

document.addEventListener('keydown', function(event) {
  if (event.altKey && event.key === 'v') {
    startSpeechRecognition();
  }
});

// Variable to track the state of speech recognition
let isRecognitionRunning = false;

// Initialize speech recognition
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = false;
recognition.lang = 'en-US';

recognition.onresult = function(event) {
  const last = event.results.length - 1;
  const command = event.results[last][0].transcript.toLowerCase();

  if (command === 'log out') {
    document.getElementById('logout-btn').click();
    playAudio('You have successfully logged out.');
  } else if (command.startsWith('add shopping list')) {
    const listName = command.replace('add shopping list', '').trim();
    if (listName) {
      addShoppingListByName(listName);
      playAudio(`Shopping list ${listName} has been added.`);
    } else {
      playAudio('Please specify the name of the shopping list.');
    }
  }
};

recognition.onend = function() {
  isRecognitionRunning = false;
};

recognition.onerror = function(event) {
  console.error('Speech recognition error:', event.error);
  isRecognitionRunning = false;
};

// Function to start speech recognition
function startSpeechRecognition() {
  if (!isRecognitionRunning) {
    recognition.start(); // Start speech recognition if not already running
    isRecognitionRunning = true;
  }
}

function playAudio(message) {
  const speech = new SpeechSynthesisUtterance();
  speech.text = message;
  speechSynthesis.speak(speech);
}

// Function to add a shopping list via voice command
async function addShoppingListByName(listName) {
  const listNameInput = document.getElementById('list-name');
  listNameInput.value = listName;

  // Create and dispatch a submit event to add a shopping list
  const event = new Event('submit', {
    bubbles: true,
    cancelable: true
  });

  const form = document.getElementById('shopping-list-form');
  form.dispatchEvent(event);
}

// Add event listener for the submit event on the form
document.getElementById('shopping-list-form').addEventListener('submit', addShoppingList);

function showNotification(message) {
  if ('Notification' in window) {
    Notification.requestPermission(function(permission) {
      if (permission === 'granted') {
        new Notification(message);
      }
    });
  } else {
    alert(message); // Fallback for browsers that do not support notifications
  }
}

// Function to check if an element is in the viewport
function isElementInViewport(el) {
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Function for lazy loading images
function lazyLoadImages() {
  const images = document.querySelectorAll('img[data-src]'); // Select all images with data-src attribute

  images.forEach(image => {
    if (isElementInViewport(image)) {
      image.src = image.dataset.src; // Load image from data attribute
      image.onload = function() {
        image.classList.add('loaded'); // Add class after image loads
      };
      image.removeAttribute('data-src'); // Remove data-src attribute after loading
    }
  });
}

document.addEventListener('DOMContentLoaded', lazyLoadImages);
window.addEventListener('scroll', lazyLoadImages);
window.addEventListener('resize', lazyLoadImages);
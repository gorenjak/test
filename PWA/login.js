const loginForm = document.getElementById('login-form');
const forgotPasswordLink = document.getElementById('forgot-password-link');
const resetPasswordModal = document.getElementById('reset-password-modal');
const resetPasswordForm = document.getElementById('reset-password-form');
const successModal = document.getElementById('success-modal');
const successClose = document.querySelector('.success-close');
const successButton = document.getElementById('success-button');
const serverApiUrl = "https://test-5fdn.onrender.com";
const pushNotificationApiUrl = "https://test-5fdn.onrender.com:4000";

// Show the password reset modal
forgotPasswordLink.onclick = function() {
  resetPasswordModal.style.display = 'block';
}

// Close the password reset modal
document.querySelector('.modal .close').onclick = function() {
  resetPasswordModal.style.display = 'none';
}

// Close the success modal
successClose.onclick = function() {
  successModal.style.display = 'none';
}

// Close the success modal when clicking the "OK" button
successButton.onclick = function() {
  successModal.style.display = 'none';
}

// Close the modal if the user clicks outside of it
window.onclick = function(event) {
  if (event.target == resetPasswordModal) {
    resetPasswordModal.style.display = 'none';
  }
  if (event.target == successModal) {
    successModal.style.display = 'none';
  }
}

// Fetch the public key for push notifications from the server
async function getPublicKey() {
  try {
    const response = await fetch('https://test-5fdn.onrender.com:4000/api/publicKey');
    const data = await response.json();
    return data.publicKey;
  } catch (error) {
    console.error('Napaka pri pridobivanju javnega ključa:', error);
    return null;
  }
}

const publicKeyPromise = getPublicKey();

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; ++i) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
}

// Register the service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('service-worker.js').then(function(registration) {
      console.log('Registracija ServiceWorkerja uspešna: ', registration.scope);
      // Subscribe to push notifications
      publicKeyPromise.then(publicKey => {
        if (publicKey) {
          registerPushNotification(publicKey);
        } else {
          console.error('Neuspešno pridobivanje javnega ključa');
        }
      });
    }, function(err) {
      console.log('Registracija ServiceWorkerja neuspešna: ', err);
    });
  });
}

async function registerPushNotification(publicKey) {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });
    
    // Send the push notification subscription to the server
    await fetch('$https://test-5fdn.onrender.com:4000/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({ subscription }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });

    console.log('Naročilo na push obvestila uspešno');
  } catch (error) {
    console.error('Napaka pri naročanju na push obvestila:', error);
  }
}

loginForm.addEventListener('submit', async function(event) {
  event.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  const response = await fetch('https://test-5fdn.onrender.com/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });

  if (response.ok) {
    const data = await response.json();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('userId', data.userId); // Shranite ID uporabnika

    // Send a push notification
    sendPushNotification('Uspešna prijava', 'Prijavili ste se v sistem!');

    window.location.href = 'index.html';
  } else {
    // Show an error message for incorrect login credentials
    document.getElementById('error-message').style.display = 'block';
  }
});

async function sendPushNotification(title, body) {
  try {
    const registration = await navigator.serviceWorker.ready;

    // Show push notification in the browser
    await registration.showNotification(title, { body });

    console.log('Potisno obvestilo poslano uspešno');
  } catch (error) {
    console.error('Napaka pri pošiljanju potisnega obvestila:', error);
  }
}

resetPasswordForm.addEventListener('submit', async function(event) {
  event.preventDefault();

  const email = document.getElementById('reset-email').value;
  const newPassword = document.getElementById('reset-new-password').value;
  const confirmPassword = document.getElementById('reset-confirm-password').value;

  if (newPassword !== confirmPassword) {
    document.getElementById('reset-error-message').innerText = 'Gesli se ne ujemata.';
    document.getElementById('reset-error-message').style.display = 'block';
    return;
  }

  const response = await fetch('https://test-5fdn.onrender.com/api/reset-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, newPassword })
  });

  if (response.ok) {
    resetPasswordModal.style.display = 'none';
    successModal.style.display = 'block';
  } else {
    const data = await response.json();
    document.getElementById('reset-error-message').innerText = data.message || 'Napaka pri ponastavitvi gesla.';
    document.getElementById('reset-error-message').style.display = 'block';
  }
});

// Function to check if the element is in the viewport
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
      image.src = image.dataset.src; // Load image from data-src attribute
      image.onload = function() {
        image.classList.add('loaded'); // Add class after image is loaded
      };
      image.removeAttribute('data-src'); // Remove data-src attribute after loading
    }
  });
}

document.addEventListener('DOMContentLoaded', lazyLoadImages);
window.addEventListener('scroll', lazyLoadImages);
window.addEventListener('resize', lazyLoadImages);
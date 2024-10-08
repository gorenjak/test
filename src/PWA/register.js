// Function to show modal
function showModal(message, redirect = false) {
  const modal = document.getElementById('modal');
  const modalMessage = document.getElementById('modal-message');
  const closeButton = document.querySelector('.close');
  const okButton = document.getElementById('modal-ok-button');

  modalMessage.textContent = message;
  modal.style.display = 'block';

  // Close modal on X click
  closeButton.onclick = function() {
    modal.style.display = 'none';
    if (redirect) {
      window.location.href = 'login.html';
    }
  }

  // Close modal on OK click
  okButton.onclick = function() {
    modal.style.display = 'none';
    if (redirect) {
      window.location.href = 'login.html';
    }
  }

  // Close modal on click outside of modal
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = 'none';
      if (redirect) {
        window.location.href = 'login.html';
      }
    }
  }
}

// Function to register user
const registerForm = document.getElementById('register-form');

registerForm.addEventListener('submit', async function(event) {
  event.preventDefault();

  const firstname = document.getElementById('firstname').value;
  const lastname = document.getElementById('lastname').value;
  const email = document.getElementById('email').value;
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  // Check if passwords match
  if (password !== confirmPassword) {
    showModal('Gesli se ne ujemata.');
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ firstname, lastname, email, username, password })
    });

    const responseData = await response.json(); // Parse the JSON response

    if (response.ok) {
      // Show modal with successful registration message and redirect
      showModal('Uporabnik uspešno registriran.', true);
    } else {
      // Show modal with error message
      if (responseData.message) {
        showModal(responseData.message); // Display error message from server
      } else {
        showModal('Prišlo je do napake pri registraciji.'); // Default error message
      }
    }
  } catch (error) {
    showModal('Prišlo je do napake pri registraciji.');
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
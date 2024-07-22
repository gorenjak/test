function logout() {
    localStorage.removeItem('accessToken'); // Remove access token
    window.location.href = 'login.html'; // Redirect to login page
}
// Funkcija za nazaj
function goBack() {
    window.location.href = 'index.html'; // Redirect to index page
}

// DOM elements
const profileData = document.getElementById('profileData');
const editModal = document.getElementById('editModal');
const deleteModal = document.getElementById('deleteModal');
const editForm = document.getElementById('editForm');
const editEmail = document.getElementById('editEmail');
const editFirstname = document.getElementById('editFirstname');
const editLastname = document.getElementById('editLastname');

// Fetch user profile data on page load
window.onload = fetchUserProfile;

// Function to fetch user profile data
async function fetchUserProfile() {
    try {
        const token = localStorage.getItem('accessToken');
        const userId = localStorage.getItem('userId');
        const response = await fetch(`http://localhost:3000/api/user/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error('Pridobivanje uporabniškega profila ni uspeloe');
        }
        const userData = await response.json();
        console.log(userData); // Print userData to console
        const { email, username, firstname, lastname } = userData.user;
        profileData.innerHTML = `
            <h2><b style="color:#719c0e">${firstname} ${lastname}</b></h2>
            <p><b style="color:#719c0e">Uporabniško ime:</b> ${username}</p>
            <p><b style="color:#719c0e">E-pošta:</b> ${email}</p>
        `;
    } catch (error) {
        console.error('Napaka pri pridobivanju uporabniškega računa:', error);
        profileData.innerHTML = '<p>Napaka pri pridobivanju uporabniškega računa</p>';
    }
}

// Function to open edit profile modal
function editProfile() {
    // Get the current user data from the displayed profile data
    const currentFirstname = document.querySelector('#profileData h2 b').textContent.split(' ')[0];
    const currentLastname = document.querySelector('#profileData h2 b').textContent.split(' ').slice(1).join(' ');
    const currentUsername = document.querySelector('#profileData p:nth-child(2)').textContent.split(': ')[1];
    const currentEmail = document.querySelector('#profileData p:nth-child(3)').textContent.split(': ')[1];

    // Set the values of the input fields to the current user data
    editEmail.value = currentEmail;
    editFirstname.value = currentFirstname;
    editLastname.value = currentLastname;

    editModal.style.display = 'block';
}

// Function to close modal
function closeModal() {
    editModal.style.display = 'none';
    deleteModal.style.display = 'none';
    changePasswordModal.style.display = 'none'; // Dodano
}

// Function to update user profile
async function updateProfile(event) {
    event.preventDefault();
    try {
        const token = localStorage.getItem('accessToken');
        const userId = localStorage.getItem('userId');
        const response = await fetch(`http://localhost:3000/api/user/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                email: editEmail.value,
                firstname: editFirstname.value,
                lastname: editLastname.value
            })
        });
        if (!response.ok) {
            throw new Error('Failed to update user profile');
        }
        closeModal();
        fetchUserProfile();
    } catch (error) {
        console.error('Error updating user profile:', error);
        alert('Failed to update user profile');
    }
}

// Function to confirm account deletion
function confirmDelete() {
    deleteModal.style.display = 'block';
}

// Function to delete user account
async function deleteAccount() {
    try {
        const token = localStorage.getItem('accessToken');
        const userId = localStorage.getItem('userId');
        const response = await fetch(`http://localhost:3000/api/user/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error('Brisanje uporabniškega računa ni uspelo');
        }
        closeModal();
        alert('Uporabniški račun je bil uspešno izbrisan');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Napaka pri brisanju uporabniškega računa:', error);
        alert('Brisanje uporabniškega računa ni uspelo');
    }
}

// Function to open change password modal
function changePassword() {
    // Reset input fields
    document.getElementById('oldPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmNewPassword').value = '';

    // Display change password modal
    document.getElementById('changePasswordModal').style.display = 'block';
}

// Function to submit change password form
async function submitChangePassword(event) {
    event.preventDefault();

    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    // Check if new password matches confirmed new password
    if (newPassword !== confirmNewPassword) {
        alert('Potrditev novega gesla se ne ujema z novim geslom.');
        return;
    }

    try {
        const token = localStorage.getItem('accessToken');
        const userId = localStorage.getItem('userId');
        const response = await fetch(`http://localhost:3000/api/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                oldPassword,
                newPassword
            })
        });
        if (!response.ok) {
            throw new Error('Gesla ni bilo mogoče spremeniti');
        }
        closeModal();
        alert('Geslo uspešno spremenjeno');
    } catch (error) {
        console.error('Error changing password:', error);
        alert('Napaka pri spreminjanju gesla');
    }
}

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
  
  // Funkcija za leno nalaganje slik
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
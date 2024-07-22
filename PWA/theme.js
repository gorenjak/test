let isColorChanged = false; // Variable to track color change state
const originalBackgroundColor = document.body.style.backgroundColor; // Store original background color
const originalTextColor = document.body.style.color; // Store original text color

// Function to handle color change
function toggleColor() {
  const productImage = document.querySelectorAll('.SmartCart-image');
  const modalContents = document.querySelectorAll('.modal-content'); // Select all modal content elements
  
  if (!isColorChanged) {
    document.body.style.backgroundColor = '#333'; // Change background color to dark gray
    document.body.style.color = '#fff'; // Change text color to white
    productImage.forEach(img => { 
      img.src = 'assets/SmartCartWhite.png'; // Change image source to SmartCartWhite.png
    });
    
    // Loop through each modal content and update styles
    modalContents.forEach(modalContent => {
      modalContent.style.backgroundColor = '#333'; // Change modal background color to dark gray
      modalContent.style.color = '#fff'; // Change modal text color to white
    });
    
    isColorChanged = true; // Update color change state
  } else {
    document.body.style.backgroundColor = originalBackgroundColor; // Revert background color to original
    document.body.style.color = originalTextColor; // Revert text color to original
    
    productImage.forEach(img => {
      img.src = 'assets/SmartCart.png'; // Change image source back to SmartCart.png
    });
    
    // Loop through each modal content and revert styles
    modalContents.forEach(modalContent => {
      modalContent.style.backgroundColor = '#fefefe'; // Revert modal background color to original
      modalContent.style.color = '#000'; // Revert modal text color to original
    });
    
    isColorChanged = false; // Update color change state
  }
}

// Add event listener to detect Alt + G key combination
document.addEventListener('keydown', function(event) {
  if (event.altKey && event.key === 'g') {
    toggleColor();
  }
});
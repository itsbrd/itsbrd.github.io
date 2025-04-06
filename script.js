console.log("Welcome to Project Poop!");

// Create audio element
const poopTheme = new Audio('theme.mp3');

// Optional: prevent autoplay on repeated clicks
let hasPlayed = false;

// Play music when clicking the logo
document.getElementById('logo-link')?.addEventListener('click', (e) => {
  // Prevent redirect if you want music to play first
  // e.preventDefault();

  if (!hasPlayed) {
    poopTheme.play();
    hasPlayed = true;
  }
});

// OR: play with a button
document.getElementById('play-button')?.addEventListener('click', () => {
  poopTheme.play();
});

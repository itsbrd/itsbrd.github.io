console.log("Welcome to Project Poop!");

const poopTheme = new Audio('theme.mp3');
poopTheme.preload = 'auto'; // optional but helps

document.getElementById('play-button')?.addEventListener('click', () => {
  poopTheme.play().then(() => {
    console.log("Audio started!");
  }).catch(err => {
    console.error("Failed to play audio:", err);
  });
});

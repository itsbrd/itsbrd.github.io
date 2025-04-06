console.log("Welcome to Project Poop!");

const poopTheme = new Audio('theme.mp3');

document.getElementById('play-button')?.addEventListener('click', () => {
  poopTheme.play().catch(err => {
    console.error("Audio error:", err);
  });
});

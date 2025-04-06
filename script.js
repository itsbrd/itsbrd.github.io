console.log("Welcome to Project Poop!");

const poopTheme = new Audio('theme.mp3');

document.getElementById('play-button.jpg')?.addEventListener('click', () => {
  poopTheme.play().catch(err => {
    console.error("Audio error:", err);
  });
});

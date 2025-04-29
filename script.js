window.addEventListener('DOMContentLoaded', () => {
  const ageGate = document.getElementById('age-gate');
  const enterBtn = document.getElementById('enter-btn');

  if (!ageGate || !enterBtn) {
    console.error('Age gate or button not found.');
    return;
  }

  // Check if user already confirmed
  if (localStorage.getItem('projectPoop18plus') === 'true') {
    ageGate.style.display = 'none';
    document.body.style.overflow = 'auto';
  } else {
    ageGate.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  enterBtn.addEventListener('click', () => {
    localStorage.setItem('projectPoop18plus', 'true');
    ageGate.style.display = 'none';
    document.body.style.overflow = 'auto';
  });
});

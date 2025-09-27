document.addEventListener('DOMContentLoaded', () => {
  const ageGate = document.getElementById('age-gate');
  const enterBtn = document.getElementById('enter-btn');
  const mainContent = document.getElementById('main-content');

  const showAgeGate = () => {
    ageGate.style.display = 'flex';
    mainContent.style.display = 'none';
    document.body.style.overflow = 'hidden';
  };

  const hideAgeGate = () => {
    ageGate.style.display = 'none';
    mainContent.style.display = 'block';
    document.body.style.overflow = 'auto';
  };

  if (localStorage.getItem('projectPoop18plus') === 'true') {
    hideAgeGate();
  } else {
    showAgeGate();
  }

  enterBtn?.addEventListener('click', () => {
    localStorage.setItem('projectPoop18plus', 'true');
    hideAgeGate();
  });
});

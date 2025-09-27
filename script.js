document.addEventListener('DOMContentLoaded', () => {
  const ageGate = document.getElementById('age-gate');
  const enterBtn = document.getElementById('enter-btn');
  const mainContent = document.getElementById('main-content');
  
  const supabase = supabase.createClient(
    'https://qmlhagpdfnckuufhhixu.supabase.co',  // replace with your actual URL
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbGhhZ3BkZm5ja3V1ZmhoaXh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMTEzMTIsImV4cCI6MjA3NDU4NzMxMn0.HFrgVdnETfPL6EDa9lrj0SwZkEFehMbDUjvkq7VkRTk'                  // replace with your anon public key
  );
  
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

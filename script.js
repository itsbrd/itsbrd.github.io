window.addEventListener('DOMContentLoaded', () => {
  const ageGate = document.getElementById('age-gate');

  if (ageGate) {
    if (localStorage.getItem('projectPoop18plus') !== 'true') {
      ageGate.style.display = 'flex';
      document.body.style.overflow = 'hidden';

      const enterBtn = document.getElementById('enter-btn');
      if (enterBtn) {
        enterBtn.addEventListener('click', () => {
          localStorage.setItem('projectPoop18plus', 'true');
          ageGate.style.display = 'none';
          document.body.style.overflow = 'auto';
        });
      }
    } else {
      ageGate.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  }



  console.log("Page loaded. JS running.");


  const cam4Source = document.getElementById('cam4-source');
  const cam4Video = document.getElementById('cam4-video');
  
  if (cam4Source && cam4Video) {
    const roll = Math.floor(Math.random() * 50) + 1;
    const timestamp = Date.now();
  
    if (roll === 1) {
      cam4Source.src = 'brdcorner.mp4?v=' + timestamp;
      console.log("👀 Secret CAM 4 activated!");
    } else {
      cam4Source.src = 'freezycorner.mp4?v=' + timestamp;
    }
  
    cam4Video.load();
  }



  document.addEventListener('keydown', (e) => {
    crtInput += e.key.toLowerCase();
  
    // Keep it trimmed to last 3 characters
    if (crtInput.length > 3) {
      crtInput = crtInput.slice(-3);
    }
  
    if (crtInput === 'crt') {
      window.location.href = 'page2.html';
    }
  });

  window.addEventListener('load', () => {
  const canvas = document.getElementById('crt-canvas');
  if (!canvas) {
    console.log("CRT canvas not found — skipping draw.");
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.log("Canvas context could not be initialized.");
    return;
  }

  // Set canvas size to match actual pixels (important!)
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;


  const supabase = supabase.createClient('https://dreermkpptbjpvnojqcv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyZWVybWtwcHRianB2bm9qcWN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4NjUwNjEsImV4cCI6MjA2MTQ0MTA2MX0.aoPudT9cFmYs6h3gZv_a6TYCd46hHen5uuD1mwMxgHM');

  async function signUp() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const { user, error } = await supabase.auth.signUp({
      email,
      password
    });
    if (error) alert(error.message);
    else alert('Signed up! Check your email to confirm.');
  }
  
  async function signIn() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const { user, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) alert(error.message);
    else {
      document.getElementById('auth-area').style.display = 'none';
      document.getElementById('chat-area').style.display = 'block';
      subscribeToMessages();
    }
  }
  
  async function sendMessage() {
    const input = document.getElementById('message-input');
    const content = input.value;
    const user = supabase.auth.user();
    if (!content) return;
  
    const { error } = await supabase.from('messages').insert([
      { username: user.email, content }
    ]);
  
    if (error) console.error(error);
    input.value = '';
  }
  
  function subscribeToMessages() {
    supabase
      .from('messages')
      .on('INSERT', payload => {
        const msg = payload.new;
        const el = document.createElement('div');
        el.innerText = `${msg.username}: ${msg.content}`;
        document.getElementById('messages').appendChild(el);
      })
      .subscribe();
  }


  // 🎶 Playlist builder logic
  function initializePlaylist() {
    const songList = [
      { title: "PROJECT POOP - BOBOLICENER, FREEZY", file: "theme.mp3" },
      { title: "PROJECT PISS - HYRAMUA, KIWASI", file: "projectpiss.mp3" },
      { title: "PROJECT POOP 2 - BOBOLICENER", file: "pp2.mp3" },
      { title: "ALL AGAIN - HYRAMUA", file: "allagain.mp3" }
    ];

    const heroStack = document.querySelector('.hero-stack');
    const container = document.createElement('div');
    container.className = "playlist";
    heroStack.appendChild(container);

    function formatTime(time) {
      const mins = Math.floor(time / 60);
      const secs = Math.floor(time % 60).toString().padStart(2, '0');
      return `${mins}:${secs}`;
    }

    songList.forEach((song, index) => {
      const wrapper = document.createElement('div');
      wrapper.className = "audio-wrapper";

      const audioId = `audio-${index}`;
      const progressId = `progress-${index}`;
      const timelineId = `timeline-${index}`;
      const playPauseId = `play-pause-${index}`;
      const currentTimeId = `current-time-${index}`;
      const durationId = `duration-${index}`;

      wrapper.innerHTML = `
        <h4>${song.title}</h4>
        <audio id="${audioId}" src="${song.file}"></audio>
        <div class="timeline" id="${timelineId}">
          <div class="progress" id="${progressId}"></div>
        </div>
        <div class="time-info">
          <span id="${currentTimeId}">0:00</span> / <span id="${durationId}">0:00</span>
        </div>
        <button id="${playPauseId}">▶️</button>
      `;

      container.appendChild(wrapper);

      const audio = wrapper.querySelector(`#${audioId}`);
      const playPause = wrapper.querySelector(`#${playPauseId}`);
      const progress = wrapper.querySelector(`#${progressId}`);
      const timeline = wrapper.querySelector(`#${timelineId}`);
      const currentTimeEl = wrapper.querySelector(`#${currentTimeId}`);
      const durationEl = wrapper.querySelector(`#${durationId}`);

      audio.addEventListener('loadedmetadata', () => {
        durationEl.textContent = formatTime(audio.duration);
      });

      audio.addEventListener('timeupdate', () => {
        const percent = (audio.currentTime / audio.duration) * 100;
        progress.style.width = `${percent}%`;
        currentTimeEl.textContent = formatTime(audio.currentTime);
      });

      timeline.addEventListener('click', (e) => {
        const timelineWidth = timeline.offsetWidth;
        const clickX = e.offsetX;
        const percent = clickX / timelineWidth;
        audio.currentTime = percent * audio.duration;
      });

      playPause.addEventListener('click', () => {
        if (audio.paused) {
          document.querySelectorAll('audio').forEach(a => {
            if (a !== audio) a.pause();
          });
          audio.play();
          playPause.textContent = '⏸️';
        } else {
          audio.pause();
          playPause.textContent = '▶️';
        }
      });

      audio.addEventListener('ended', () => {
        playPause.textContent = '▶️';
      });
    });
  }
});

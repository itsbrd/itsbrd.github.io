window.addEventListener('DOMContentLoaded', () => {
  console.log("Page loaded. JS running.");

  // 🔒 Age gate check
  if (localStorage.getItem('projectPoop18plus') !== 'true') {
    document.getElementById('age-gate').style.display = 'flex';
    document.body.style.overflow = 'hidden';

    document.getElementById('enter-btn')?.addEventListener('click', () => {
      localStorage.setItem('projectPoop18plus', 'true');
      document.getElementById('age-gate').style.display = 'none';
      document.body.style.overflow = 'auto';
      initializePlaylist(); // Start main site after confirmation
    });
  } else {
    document.getElementById('age-gate').style.display = 'none';
    initializePlaylist(); // Already confirmed — load playlist
  }

  // 🎲 CAM 4 Randomizer (1 in 50 chance for alternate video)
  const cam4Video = document.getElementById('freezycorner');
  const cam4Source = document.getElementById('freezycorner');
  const roll = Math.floor(Math.random() * 50) + 1;
  const timestamp = Date.now(); // to force refresh every time
  
  if (roll === 1) {
    cam4Source.src = 'brdcorner.mp4?v=' + timestamp;
    console.log("🎥 Secret CAM 4 activated!");
  } else {
    cam4Source.src = 'freezycorner.mp4?v=' + timestamp;
  }
  
  cam4Video.load(); // force video to reprocess the new source

  let crtInput = '';

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


window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('crt-canvas');
  const ctx = canvas.getContext('2d');

  // Set canvas size to screen size
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Draw interlace lines
  for (let y = 0; y < canvas.height; y += 2) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // slight transparency for subtlety
    ctx.fillRect(0, y, canvas.width, 1);
  }
});

  


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

window.addEventListener('DOMContentLoaded', () => {
  console.log("Page loaded. JS running.");

  const songList = [
    { title: "PROJECT POOP", file: "theme.mp3" },
    { title: "PROJECT PISS", file: "projectpiss.mp3" },
    { title: "PROJECT POOP 2", file: "pp2.mp3" },
    { title: "ALL AGAIN", file: "allagain.mp3" }
  ];

  const heroStack = document.querySelector('.hero-stack');
  const container = document.createElement('div');
  container.className = "playlist";
  heroStack.appendChild(container);

  // Format time helper
  function formatTime(time) {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  // Build each player
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

    // DOM references
    const audio = wrapper.querySelector(`#${audioId}`);
    const playPause = wrapper.querySelector(`#${playPauseId}`);
    const progress = wrapper.querySelector(`#${progressId}`);
    const timeline = wrapper.querySelector(`#${timelineId}`);
    const currentTimeEl = wrapper.querySelector(`#${currentTimeId}`);
    const durationEl = wrapper.querySelector(`#${durationId}`);

    // Set duration when loaded
    audio.addEventListener('loadedmetadata', () => {
      durationEl.textContent = formatTime(audio.duration);
    });

    // Update time and progress
    audio.addEventListener('timeupdate', () => {
      const percent = (audio.currentTime / audio.duration) * 100;
      progress.style.width = `${percent}%`;
      currentTimeEl.textContent = formatTime(audio.currentTime);
    });

    // Seek click
    timeline.addEventListener('click', (e) => {
      const timelineWidth = timeline.offsetWidth;
      const clickX = e.offsetX;
      const percent = clickX / timelineWidth;
      audio.currentTime = percent * audio.duration;
    });

    // Play/pause toggle
    playPause.addEventListener('click', () => {
      if (audio.paused) {
        // pause all other players first
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

    // Reset button when finished
    audio.addEventListener('ended', () => {
      playPause.textContent = '▶️';
    });
  });
});

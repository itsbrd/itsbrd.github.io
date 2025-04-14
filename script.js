console.log("JS loaded!");

const audio = document.getElementById('theme-audio');
const playPause = document.getElementById('play-pause');
const progress = document.getElementById('progress');
const timeline = document.getElementById('timeline');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');

function formatTime(time) {
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

// Play / Pause toggle
playPause.addEventListener('click', () => {
  if (audio.paused) {
    audio.play();
    playPause.textContent = '⏸️';
  } else {
    audio.pause();
    playPause.textContent = '▶️';
  }
});

// Update progress bar and times
audio.addEventListener('timeupdate', () => {
  const percent = (audio.currentTime / audio.duration) * 100;
  progress.style.width = `${percent}%`;
  currentTimeEl.textContent = formatTime(audio.currentTime);
});

audio.addEventListener('loadedmetadata', () => {
  durationEl.textContent = formatTime(audio.duration);
});

// Click to seek
timeline.addEventListener('click', (e) => {
  const timelineWidth = timeline.offsetWidth;
  const clickX = e.offsetX;
  const percent = clickX / timelineWidth;
  audio.currentTime = percent * audio.duration;
});


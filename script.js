// ===== PROJECT POOP RUNTIME (NO TAP GATE) =====

const playlistContainer = document.getElementById("playlist");
const songsFoundEl = document.getElementById("songsFound");

let currentAudio = null;
let currentButton = null;

// Load songs from songs.js
document.addEventListener("DOMContentLoaded", async () => {
  await loadSongs();
});

async function loadSongs() {
  if (typeof getSongFiles !== "function") {
    console.error("songs.js not loaded properly.");
    return;
  }

  const files = await getSongFiles();
  songsFoundEl.textContent = `Songs Found: ${files.length}/52`;

  files.forEach((file) => {
    createTrackCard(file);
  });
}

function createTrackCard(file) {
  const card = document.createElement("div");
  card.className = "track-card";

  const title = document.createElement("div");
  title.className = "track-title";
  title.textContent = formatTitle(file.name);

  const controls = document.createElement("div");
  controls.className = "track-controls";

  const playBtn = document.createElement("img");
  playBtn.src = "play-button.png";
  playBtn.className = "play-button";

  const progress = document.createElement("div");
  progress.className = "progress-bar";

  const progressFill = document.createElement("div");
  progressFill.className = "progress-fill";
  progress.appendChild(progressFill);

  const time = document.createElement("div");
  time.className = "time-display";
  time.textContent = "0:00 / 0:00";

  const downloadBtn = document.createElement("a");
  downloadBtn.href = file.url;
  downloadBtn.download = file.name;
  downloadBtn.className = "download-button";
  downloadBtn.textContent = "⬇";

  const audio = new Audio(file.url);

  playBtn.addEventListener("click", () => {
    if (currentAudio && currentAudio !== audio) {
      currentAudio.pause();
      currentButton.src = "play-button.png";
    }

    if (audio.paused) {
      audio.play();
      playBtn.src = "pause-button.png";
      currentAudio = audio;
      currentButton = playBtn;
    } else {
      audio.pause();
      playBtn.src = "play-button.png";
    }
  });

  audio.addEventListener("timeupdate", () => {
    const percent = (audio.currentTime / audio.duration) * 100;
    progressFill.style.width = percent + "%";

    time.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
  });

  audio.addEventListener("ended", () => {
    playBtn.src = "play-button.png";
  });

  controls.appendChild(playBtn);
  controls.appendChild(progress);
  controls.appendChild(time);
  controls.appendChild(downloadBtn);

  card.appendChild(title);
  card.appendChild(controls);

  playlistContainer.appendChild(card);
}

function formatTitle(filename) {
  return filename
    .replace(/\.(mp3|wav)$/i, "")
    .replace(/[-_]/g, " ")
    .toUpperCase();
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Project Poop – dynamic playlist loader + custom player UI
// Works on GitHub Pages (no build tools). No modules/imports needed.

// ====== CONFIG ======
const GITHUB_OWNER  = "itsbrd";
const GITHUB_REPO   = "itsbrd.github.io";
const GITHUB_BRANCH = "main";
const SONGS_PATH    = "songs"; // folder in repo containing audio files

// Supported audio extensions (case-insensitive)
const AUDIO_EXT_RE = /\.(mp3|wav|m4a|ogg)$/i;

// ====== STATE ======
let songsFound = Number(localStorage.getItem("pp_songsfound")) || 0;

// ====== DOM HELPERS ======
function $(sel, root = document) { return root.querySelector(sel); }
function $all(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

function setStatus(msg) {
  const el = document.getElementById("status");
  if (el) el.textContent = msg || "";
}

function updateSongsFound() {
  const el = document.getElementById("songs-found");
  if (el) el.textContent = `Songs Found: ${songsFound}/52`;
  localStorage.setItem("pp_songsfound", String(songsFound));
}

function formatTime(time) {
  if (!Number.isFinite(time) || time < 0) return "0:00";
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function filenameToTitle(name) {
  return name
    .replace(AUDIO_EXT_RE, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

// ====== GITHUB API ======
async function fetchRepoDirContents(path) {
  const apiUrl =
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(GITHUB_BRANCH)}`;

  const res = await fetch(apiUrl, { headers: { "Accept": "application/vnd.github+json" } });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GitHub API ${res.status}: ${text || res.statusText}`);
  }

  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error("Expected a directory listing array from GitHub API. Is SONGS_PATH a folder?");
  }
  return data;
}

async function loadSongListFromGitHub() {
  const items = await fetchRepoDirContents(SONGS_PATH);

  const files = items
    .filter(i => i.type === "file" && AUDIO_EXT_RE.test(i.name) && i.download_url)
    .map(i => ({
      name: i.name,
      title: filenameToTitle(i.name),
      url: i.download_url
    }))
    // sort naturally (001, 002, 010…)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  return files;
}

// ====== UI BUILD ======
function ensurePlaylistContainer() {
  const heroStack = document.querySelector(".hero-stack") || document.body;
  let container = heroStack.querySelector(".playlist");

  if (!container) {
    container = document.createElement("div");
    container.className = "playlist";
    heroStack.appendChild(container);
  }

  return container;
}

function pauseAllExcept(currentAudio) {
  $all("audio").forEach(a => { if (a !== currentAudio) a.pause(); });
  $all(".audio-wrapper button").forEach(b => { b.textContent = "▶️"; });
}

function wirePlayer(wrapper) {
  const audio = wrapper.querySelector("audio");
  const button = wrapper.querySelector("button");
  const timeline = wrapper.querySelector(".timeline");
  const progress = wrapper.querySelector(".progress");
  const currentTimeEl = wrapper.querySelector(".current-time");
  const durationEl = wrapper.querySelector(".duration");

  // Some browsers (esp iOS) can be picky; this helps with CORS + decoding.
  audio.crossOrigin = "anonymous";
  audio.preload = "metadata";

  audio.addEventListener("loadedmetadata", () => {
    durationEl.textContent = formatTime(audio.duration);
  });

  audio.addEventListener("timeupdate", () => {
    const dur = audio.duration || 0;
    const pct = dur ? (audio.currentTime / dur) * 100 : 0;
    progress.style.width = `${pct}%`;
    currentTimeEl.textContent = formatTime(audio.currentTime);
  });

  audio.addEventListener("ended", () => {
    button.textContent = "▶️";
  });

  audio.addEventListener("error", () => {
    // This will catch 404s / unsupported codecs / CORS problems.
    const mediaErr = audio.error;
    console.error("[AudioError]", { src: audio.currentSrc, error: mediaErr });
    setStatus("Audio failed to load. (Bad path or unsupported audio format.)");
  });

  timeline.addEventListener("click", (e) => {
    const rect = timeline.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.min(1, Math.max(0, x / rect.width));
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = pct * audio.duration;
    }
  });

  button.addEventListener("click", async () => {
    setStatus("");

    pauseAllExcept(audio);

    // If already playing -> pause
    if (!audio.paused) {
      audio.pause();
      button.textContent = "▶️";
      return;
    }

    try {
      // Force-load if needed (helps when metadata isn't ready yet)
      if (audio.readyState < 2) audio.load();

      const playPromise = audio.play();
      // audio.play() returns a promise in modern browsers; await to catch blocks.
      if (playPromise && typeof playPromise.then === "function") {
        await playPromise;
      }

      button.textContent = "⏸️";
    } catch (err) {
      console.error("[PlayBlocked]", err);
      // On iOS, this can happen if the browser thinks it wasn't a user gesture,
      // or if the file can't be decoded. We give a helpful message.
      setStatus("Tap the play button again (Safari can be picky), or check the file format/path.");
      button.textContent = "▶️";
    }
  });
}

function createSongRow(song) {
  const wrapper = document.createElement("div");
  wrapper.className = "audio-wrapper";

  wrapper.innerHTML = `
    <h4>${song.title}</h4>
    <audio src="${song.url || song.file}"></audio>

    <div class="timeline">
      <div class="progress"></div>
    </div>

    <div class="time-info">
      <span class="current-time">0:00</span> / <span class="duration">0:00</span>
    </div>

    <button type="button" aria-label="Play/Pause">▶️</button>
  `;

  wirePlayer(wrapper);
  return wrapper;
}

async function buildPlaylist() {
  const container = ensurePlaylistContainer();
  container.innerHTML = "";

  setStatus("Loading songs…");

  let songs = [];
  try {
    songs = await loadSongListFromGitHub();
  } catch (err) {
    console.error("[SongLoadFail]", err);
    setStatus("Couldn’t load songs from GitHub API. (Rate limit or bad path.)");
  }

  if (!songs.length) {
    setStatus("No songs found in /songs (mp3/wav/m4a/ogg).");
    return;
  }

  setStatus(`Loaded ${songs.length} song(s).`);
  songs.forEach(song => container.appendChild(createSongRow(song)));
}

// ====== BOOT ======
document.addEventListener("DOMContentLoaded", () => {
  updateSongsFound();
  buildPlaylist();
});

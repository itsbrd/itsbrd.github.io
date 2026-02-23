// script.js
import { getSongsList, SONGS_PER_ALBUM_TOTAL } from "./songs.js";

const playlistEl = document.getElementById("playlist");
const songsFoundEl = document.getElementById("songs-found");
const tapOverlay = document.getElementById("tap-overlay");

let tracks = [];
let activeAudio = null;

// Bump this if you ever need to invalidate cached song lists
const CACHE_KEY = "pp_song_cache_v3";
const CACHE_TS_KEY = "pp_song_cache_ts_v3";
const CACHE_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

function formatTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function drawScanlines() {
  const canvas = document.getElementById("scanlines");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const width = window.innerWidth;
  const height = window.innerHeight;

  // Handle HiDPI
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  for (let y = 0; y < height; y += 2) ctx.fillRect(0, y, width, 1);
}

function showTapOverlay() {
  if (!tapOverlay) return;
  tapOverlay.hidden = false;
}

function hideTapOverlay() {
  if (!tapOverlay) return;
  tapOverlay.hidden = true;
}

function stopAllExcept(audio) {
  for (const t of tracks) {
    if (t.audio !== audio) {
      t.audio.pause();
      t.audio.currentTime = 0;
      t.playBtnImg.dataset.state = "play";
      t.playBtnImg.style.opacity = "0.9";
      t.timeEl.textContent = `0:00 / ${formatTime(t.audio.duration || 0)}`;
      t.bar.style.width = "0%";
    }
  }
}

async function safePlay(audio) {
  try {
    await audio.play();
    hideTapOverlay();
    return true;
  } catch (e) {
    // iOS / Safari sometimes needs a user gesture; the click IS a gesture,
    // but if it still blocks, show an overlay and try again on next tap.
    console.warn("[Audio] play() blocked:", e);
    showTapOverlay();
    return false;
  }
}

function makeTrackCard(song) {
  const wrap = document.createElement("div");
  wrap.className = "track";

  const title = document.createElement("h3");
  title.className = "track-title";
  title.textContent = song.title;

  const row = document.createElement("div");
  row.className = "track-row";

  const progress = document.createElement("div");
  progress.className = "progress";
  const bar = document.createElement("div");
  bar.className = "bar";
  progress.appendChild(bar);

  const time = document.createElement("div");
  time.className = "time";
  time.textContent = "0:00 / 0:00";

  const playBtn = document.createElement("button");
  playBtn.className = "btn";
  playBtn.type = "button";
  playBtn.setAttribute("aria-label", `Play ${song.title}`);

  const playImg = document.createElement("img");
  playImg.src = "play-button.png";
  playImg.alt = "";
  playImg.dataset.state = "play";
  playBtn.appendChild(playImg);

  const dl = document.createElement("a");
  dl.className = "download-btn";
  dl.href = song.file;
  dl.download = "";
  dl.setAttribute("aria-label", `Download ${song.title}`);
  dl.innerHTML = "<span>⬇︎</span>";

  const audio = new Audio(song.file);
  audio.preload = "metadata";

  audio.addEventListener("loadedmetadata", () => {
    time.textContent = `0:00 / ${formatTime(audio.duration || 0)}`;
  });

  audio.addEventListener("timeupdate", () => {
    const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    bar.style.width = `${pct}%`;
    time.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration || 0)}`;
  });

  audio.addEventListener("ended", () => {
    playImg.dataset.state = "play";
  });

  playBtn.addEventListener("click", async () => {
    // Toggle play/pause
    if (audio.paused) {
      stopAllExcept(audio);
      const ok = await safePlay(audio);
      if (ok) playImg.dataset.state = "pause";
    } else {
      audio.pause();
      playImg.dataset.state = "play";
    }
  });

  // Click progress bar to seek
  progress.addEventListener("click", (e) => {
    if (!audio.duration) return;
    const rect = progress.getBoundingClientRect();
    const x = Math.min(Math.max(0, e.clientX - rect.left), rect.width);
    audio.currentTime = (x / rect.width) * audio.duration;
  });

  row.appendChild(progress);
  row.appendChild(time);
  row.appendChild(playBtn);
  row.appendChild(dl);

  wrap.appendChild(title);
  wrap.appendChild(row);

  return { wrap, audio, bar, timeEl: time, playBtnImg: playImg };
}

function setSongsFoundCount(x) {
  const safe = Number.isFinite(x) ? x : 0;
  if (songsFoundEl) songsFoundEl.textContent = `Songs Found: ${safe}/${SONGS_PER_ALBUM_TOTAL}`;
}

async function loadSongs() {
  // Cache to avoid hammering GitHub API
  try {
    const ts = Number(localStorage.getItem(CACHE_TS_KEY) || 0);
    const cached = localStorage.getItem(CACHE_KEY);
    const fresh = cached && ts && (Date.now() - ts) < CACHE_MAX_AGE_MS;

    if (fresh) return JSON.parse(cached);

    const list = await getSongsList();
    localStorage.setItem(CACHE_KEY, JSON.stringify(list));
    localStorage.setItem(CACHE_TS_KEY, String(Date.now()));
    return list;
  } catch (e) {
    console.warn("[Songs] cache/load error:", e);
    return await getSongsList();
  }
}

function renderSongs(list) {
  playlistEl.innerHTML = "";
  tracks = [];

  setSongsFoundCount(list.length);

  for (const song of list) {
    const t = makeTrackCard(song);
    tracks.push(t);
    playlistEl.appendChild(t.wrap);
  }

  // If iOS blocks play, overlay tells user to tap; this will unlock next time.
  if (tapOverlay) {
    tapOverlay.addEventListener("click", () => {
      hideTapOverlay();
    });
  }
}

async function init() {
  drawScanlines();
  window.addEventListener("resize", drawScanlines);

  if (!playlistEl) return;

  const list = await loadSongs();
  renderSongs(list);
}

init();

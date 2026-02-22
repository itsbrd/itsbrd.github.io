// ===== Project Poop (no Supabase) =====

// Local song progress (optional)
let songsFound = Number(localStorage.getItem("pp_songsfound")) || 0;

// Your songs (edit names/files here)
const songList = [
  { title: "PROJECT POOP", file: "theme.mp3" },
  { title: "PROJECT PISS", file: "projectpiss.mp3" },
  { title: "PROJECT POOP 2", file: "pp2.mp3" },
  { title: "ALL AGAIN", file: "allagain.mp3" }
];

document.addEventListener("DOMContentLoaded", () => {
  drawScanlines();
  window.addEventListener("resize", drawScanlines);

  updateSongsFound();
  buildPlaylist();
});

function formatTime(t) {
  if (!Number.isFinite(t) || t < 0) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function updateSongsFound() {
  const el = document.getElementById("songs-found");
  if (el) el.textContent = `Songs Found: ${songsFound}/52`;
  localStorage.setItem("pp_songsfound", String(songsFound));
}

// CRT scanlines that always match the *browser window* size
function drawScanlines() {
  const canvas = document.getElementById("scanlines");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const w = window.innerWidth;
  const h = window.innerHeight;

  // match device pixel ratio for crispness
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "rgba(0, 0, 0, 0.50)";
  for (let y = 0; y < h; y += 2) {
    ctx.fillRect(0, y, w, 1);
  }
}

function buildPlaylist() {
  const heroStack = document.querySelector(".hero-stack");
  if (!heroStack) return;

  // remove any previous playlist (in case of hot reloads)
  heroStack.querySelectorAll(".playlist").forEach((p) => p.remove());

  const container = document.createElement("div");
  container.className = "playlist";
  heroStack.appendChild(container);

  songList.forEach((song, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "audio-wrapper";

    wrapper.innerHTML = `
      <h4>${song.title}</h4>

      <audio preload="metadata" src="${song.file}"></audio>

      <div class="timeline">
        <div class="progress"></div>
      </div>

      <div class="controls">
        <button class="play-btn" type="button" aria-label="Play/Pause">▶️</button>
        <div class="time">
          <span class="cur">0:00</span> / <span class="dur">0:00</span>
        </div>
      </div>
    `;

    container.appendChild(wrapper);

    const audio = wrapper.querySelector("audio");
    const playBtn = wrapper.querySelector(".play-btn");
    const progress = wrapper.querySelector(".progress");
    const timeline = wrapper.querySelector(".timeline");
    const curEl = wrapper.querySelector(".cur");
    const durEl = wrapper.querySelector(".dur");

    audio.addEventListener("loadedmetadata", () => {
      durEl.textContent = formatTime(audio.duration);
    });

    audio.addEventListener("timeupdate", () => {
      const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
      progress.style.width = `${pct}%`;
      curEl.textContent = formatTime(audio.currentTime);
    });

    timeline.addEventListener("click", (e) => {
      const rect = timeline.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      if (audio.duration) audio.currentTime = x * audio.duration;
    });

    playBtn.addEventListener("click", async () => {
      // pause all other audio first
      document.querySelectorAll("audio").forEach((a) => {
        if (a !== audio) a.pause();
      });
      document.querySelectorAll(".play-btn").forEach((b) => {
        if (b !== playBtn) b.textContent = "▶️";
      });

      if (audio.paused) {
        try {
          await audio.play();
          playBtn.textContent = "⏸️";
        } catch (err) {
          console.warn("Audio play blocked:", err);
        }
      } else {
        audio.pause();
        playBtn.textContent = "▶️";
      }
    });

    audio.addEventListener("ended", () => {
      playBtn.textContent = "▶️";
    });
  });
}

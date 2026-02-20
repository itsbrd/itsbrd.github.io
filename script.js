// script.js (no Supabase / no auth)
//
// What this does:
// - Draws a CRT scanline overlay sized to the *browser window* (not desktop)
// - Builds a simple multi-song playlist UI
// - Keeps a local 'songsfound' counter in localStorage (pure front-end for now)

(function () {
  'use strict';

  const TOTAL_SONGS = 52;

  // ---- Helpers ----
  function $(sel, root = document) { return root.querySelector(sel); }
  function $all(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  function formatTime(time) {
    if (!Number.isFinite(time) || time < 0) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  // ---- Songs Found (local, for now) ----
  function getSongsFound() {
    const raw = localStorage.getItem('pp_songsfound');
    const n = parseInt(raw ?? '0', 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }

  function setSongsFound(n) {
    const safe = Math.max(0, Math.min(TOTAL_SONGS, Math.floor(n)));
    localStorage.setItem('pp_songsfound', String(safe));
    const el = $('#songs-found');
    if (el) el.textContent = `Songs Found: ${safe}/${TOTAL_SONGS}`;
  }

  // ---- CRT Scanlines (canvas) ----
  function drawScanlines() {
    const canvas = document.getElementById('scanlines');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    // Make sure the canvas sits on top
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';

    ctx.clearRect(0, 0, width, height);

    // every other horizontal line
    ctx.fillStyle = 'rgba(0, 0, 0, 0.60)'; // tweak opacity here
    for (let y = 0; y < height; y += 2) {
      ctx.fillRect(0, y, width, 1);
    }
  }

  // ---- Playlist UI ----
  const songList = [
    // Add / rename tracks here. Files should sit beside your html in the repo.
    // Example: { title: 'PROJECT POOP - BOBOLICENER, FREEZY', file: 'theme.mp3' }
    { title: 'PROJECT POOP', file: 'theme.mp3' },
    { title: 'PROJECT PISS', file: 'projectpiss.mp3' },
    { title: 'PROJECT POOP 2', file: 'pp2.mp3' },
    { title: 'ALL AGAIN', file: 'allagain.mp3' }
  ];

  function buildPlaylist() {
    const heroStack = $('.hero-stack');
    if (!heroStack) return;

    // If it already exists, don't duplicate on hot reloads
    let container = $('.playlist');
    if (!container) {
      container = document.createElement('div');
      container.className = 'playlist';
      heroStack.appendChild(container);
    } else {
      container.innerHTML = '';
    }

    songList.forEach((song, index) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'audio-wrapper';

      wrapper.innerHTML = `
        <h4>${song.title}</h4>
        <audio preload="metadata" src="${song.file}"></audio>
        <div class="timeline"><div class="progress"></div></div>
        <div class="time-info"><span class="current">0:00</span> / <span class="duration">0:00</span></div>
        <button class="pp-playpause" aria-label="Play/Pause">▶️</button>
      `;

      container.appendChild(wrapper);

      const audio = $('audio', wrapper);
      const playPause = $('.pp-playpause', wrapper);
      const progress = $('.progress', wrapper);
      const timeline = $('.timeline', wrapper);
      const currentTimeEl = $('.current', wrapper);
      const durationEl = $('.duration', wrapper);

      // Metadata
      audio.addEventListener('loadedmetadata', () => {
        durationEl.textContent = formatTime(audio.duration);
      });

      // Progress updates
      audio.addEventListener('timeupdate', () => {
        const d = audio.duration;
        const pct = d ? (audio.currentTime / d) * 100 : 0;
        progress.style.width = `${pct}%`;
        currentTimeEl.textContent = formatTime(audio.currentTime);
      });

      // Click to seek
      timeline.addEventListener('click', (e) => {
        const rect = timeline.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = Math.max(0, Math.min(1, x / rect.width));
        if (audio.duration) audio.currentTime = pct * audio.duration;
      });

      // Play / pause
      playPause.addEventListener('click', async () => {
        try {
          if (audio.paused) {
            // pause all other tracks
            $all('audio').forEach(a => { if (a !== audio) a.pause(); });
            $all('.pp-playpause').forEach(b => { if (b !== playPause) b.textContent = '▶️'; });

            await audio.play();
            playPause.textContent = '⏸️';
          } else {
            audio.pause();
            playPause.textContent = '▶️';
          }
        } catch (err) {
          console.warn('[Audio] play() failed (autoplay policy / missing file?):', err);
        }
      });

      audio.addEventListener('ended', () => {
        playPause.textContent = '▶️';
      });
    });
  }

  // ---- Boot ----
  window.addEventListener('DOMContentLoaded', () => {
    // Initialize local counter UI
    setSongsFound(getSongsFound());

    // Build playlist
    buildPlaylist();

    // Draw scanlines now + on resize
    drawScanlines();
    window.addEventListener('resize', drawScanlines);
  });

})();

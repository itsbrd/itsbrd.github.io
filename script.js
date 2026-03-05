import { FALLBACK_SONGS } from './songs.js';

const GITHUB_OWNER = 'itsbrd';
const GITHUB_REPO  = 'itsbrd.github.io';
const SONGS_DIR    = 'songs';           // folder in repo
const TOTAL_SONGS  = 52;

const statusEl   = document.getElementById('status');
const playlistEl = document.getElementById('playlist');
const songsFoundEl = document.getElementById('songs-found');

function setStatus(msg){
  if (!statusEl) return;
  statusEl.textContent = msg || '';
}

function formatTime(t){
  if (!Number.isFinite(t) || t < 0) return '0:00';
  const m = Math.floor(t/60);
  const s = Math.floor(t%60).toString().padStart(2,'0');
  return `${m}:${s}`;
}

// Single shared audio element to avoid iOS Safari weirdness with multiple audio tags
const audio = new Audio();
audio.preload = 'metadata';
audio.playsInline = true;
audio.setAttribute('playsinline', '');

let currentButton = null;
let currentProgress = null;
let currentTimeEl = null;
let currentDurationEl = null;

function pauseAndResetUI(){
  audio.pause();
  if (currentButton) currentButton.textContent = '▶️';
}

audio.addEventListener('ended', pauseAndResetUI);

audio.addEventListener('timeupdate', () => {
  if (!currentProgress || !currentTimeEl) return;
  const pct = (audio.currentTime / (audio.duration || 1)) * 100;
  currentProgress.style.width = `${pct}%`;
  currentTimeEl.textContent = formatTime(audio.currentTime);
});

audio.addEventListener('loadedmetadata', () => {
  if (currentDurationEl) currentDurationEl.textContent = formatTime(audio.duration);
});

audio.addEventListener('error', () => {
  setStatus('Audio error. If this is WAV, try MP3 (iOS Safari is picky). Also confirm file path: /songs/filename.mp3');
  pauseAndResetUI();
});

async function fetchSongsFromGitHub(){
  const cacheKey = 'pp_song_cache_v1';
  const cacheTsKey = 'pp_song_cache_ts_v1';
  const cached = localStorage.getItem(cacheKey);
  const ts = Number(localStorage.getItem(cacheTsKey) || 0);
  const fresh = cached && (Date.now() - ts) < (10 * 60 * 1000); // 10 min

  if (fresh){
    try { return JSON.parse(cached); } catch {}
  }

  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${SONGS_DIR}`;
  const res = await fetch(url, { headers: { 'Accept': 'application/vnd.github+json' } });
  if (!res.ok) throw new Error(`GitHub API ${res.status} ${res.statusText}`);

  const items = await res.json();

  const songs = items
    .filter(x => x.type === 'file')
    .filter(x => /\.(mp3|wav|m4a|aac|ogg)$/i.test(x.name))
    .map(x => {
      const order = extractTrackNumber(x.name);
      return {
        order,
        title: prettifyTitle(x.name),      // display title (number removed)
        file: `${SONGS_DIR}/${encodeURIComponent(x.name)}`     // actual file path keeps the number
      };
    })
    // Sort by leading number first, then fallback alphabetical
    .sort((a,b) =>
      (a.order - b.order) ||
      a.title.localeCompare(b.title, undefined, { numeric:true, sensitivity:'base' })
    );

  localStorage.setItem(cacheKey, JSON.stringify(songs));
  localStorage.setItem(cacheTsKey, String(Date.now()));
  return songs;
}

function extractTrackNumber(filename){
  // matches: "01 song.mp3", "1 - song.mp3", "001_song.mp3", "12) song.mp3"
  const base = filename.replace(/\.[^.]+$/,'');
  const m = base.match(/^\s*(\d{1,4})\s*([\-_.\)]\s*)?/);
  return m ? Number(m[1]) : Number.POSITIVE_INFINITY;
}

function prettifyTitle(filename){
  // 1) remove extension
  let t = filename.replace(/\.[^.]+$/,'');

  // 2) convert separators to spaces
  t = t.replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim();

  // 3) remove leading track number + optional punctuation
  // "01 song" -> "song"
  // "1 - song" -> "song"
  // "12) song" -> "song"
  t = t.replace(/^\s*\d{1,4}\s*[\)\.\-_:]*\s*/,'').trim();

  return t;
}

function buildTrackUI(song){
  const card = document.createElement('div');
  card.className = 'track';

  const title = document.createElement('h3');
  title.className = 'track-title';
  title.textContent = song.title;

  const timeline = document.createElement('div');
  timeline.className = 'timeline';

  const progress = document.createElement('div');
  progress.className = 'progress';
  timeline.appendChild(progress);

  const controls = document.createElement('div');
  controls.className = 'controls';

  const time = document.createElement('div');
  time.className = 'time';
  const cur = document.createElement('span');
  cur.textContent = '0:00';
  const dur = document.createElement('span');
  dur.textContent = '0:00';
  time.appendChild(cur);
  time.appendChild(document.createTextNode(' / '));
  time.appendChild(dur);

  const btn = document.createElement('button');
  btn.className = 'playbtn';
  btn.type = 'button';
  btn.textContent = '▶️';

  timeline.addEventListener('click', (e) => {
    const nextSrc = new URL(song.file, window.location.href).toString();
    if (audio.src !== nextSrc || !Number.isFinite(audio.duration)) return;
    const rect = timeline.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = Math.max(0, Math.min(audio.duration, pct * audio.duration));
  });

  btn.addEventListener('click', async () => {
    try{
      const nextSrc = new URL(song.file, window.location.href).toString();

      currentButton = btn;
      currentProgress = progress;
      currentTimeEl = cur;
      currentDurationEl = dur;

      if (audio.src !== nextSrc){
        pauseAndResetUI();
        progress.style.width = '0%';
        cur.textContent = '0:00';
        dur.textContent = '0:00';
        audio.src = nextSrc;
        audio.load();
      }

      if (audio.paused){
        setStatus('');
        const p = audio.play();
        if (p) await p;
        btn.textContent = '⏸️';
      } else {
        audio.pause();
        btn.textContent = '▶️';
      }
    } catch(err){
      console.error('[PlayError]', err);
      setStatus('Playback blocked. Tap the page once, then press play again. MP3 works best on iPhone.');
      btn.textContent = '▶️';
    }
  });

  controls.appendChild(time);
  controls.appendChild(btn);

  card.appendChild(title);
  card.appendChild(timeline);
  card.appendChild(controls);
  return card;
}

async function init(){
  if (!playlistEl){
    console.warn('[Init] No #playlist found.');
    return;
  }

  setStatus('Loading songs…');

  let songs = [];
  try{
    songs = await fetchSongsFromGitHub();
    if (!songs.length) throw new Error('No audio files found in /songs.');
    setStatus('');
  } catch (e){
    console.warn('[Songs] GitHub fetch failed, using fallback list.', e);
    setStatus('Could not load songs via GitHub API (rate limit/offline). Using fallback list.');
    songs = Array.isArray(FALLBACK_SONGS) ? FALLBACK_SONGS : [];
  }

  playlistEl.innerHTML = '';
  songs.forEach(song => playlistEl.appendChild(buildTrackUI(song)));

  if (songsFoundEl){
    songsFoundEl.textContent = `Songs Found: 0/${TOTAL_SONGS}`;
  }

  console.log('[Init] Songs loaded:', songs.length);
  console.log('[Init] Example song path:', songs[0]?.file);
  if (!songs.length) setStatus('No songs found.');
}

if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

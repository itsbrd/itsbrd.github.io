// ====== CONFIG ======
// Set these to match your GitHub repo:
const GITHUB_OWNER  = "YOUR_GITHUB_USERNAME";
const GITHUB_REPO   = "YOUR_REPO_NAME";
const GITHUB_BRANCH = "main";     // change to "master" if needed
const SONGS_PATH    = "songs";    // folder containing .wav files

// If you have subfolders inside /songs and want recursive search, set true:
const RECURSIVE = false;

// ====== DOM ======
const listEl = document.getElementById("song-list");
const statusEl = document.getElementById("status");

function setStatus(msg) {
  if (statusEl) statusEl.textContent = msg;
}

function filenameToTitle(name) {
  // "my_song-name.wav" -> "my song name"
  return name
    .replace(/\.wav$/i, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

function createSongRow({ title, url }) {
  const wrap = document.createElement("div");
  wrap.className = "song-row";

  const label = document.createElement("div");
  label.className = "song-title";
  label.textContent = title;

  const audio = document.createElement("audio");
  audio.controls = true;
  audio.preload = "none";
  audio.src = url;

  wrap.appendChild(label);
  wrap.appendChild(audio);
  return wrap;
}

async function fetchRepoDirContents(path) {
  const apiUrl =
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(GITHUB_BRANCH)}`;

  const res = await fetch(apiUrl, {
    headers: { "Accept": "application/vnd.github+json" }
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GitHub API error ${res.status}: ${text || res.statusText}`);
  }

  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error("Expected a directory listing array from GitHub API. Is SONGS_PATH pointing to a folder?");
  }
  return data;
}

async function findWavsInDir(path) {
  const items = await fetchRepoDirContents(path);

  const wavFiles = [];
  const folders = [];

  for (const item of items) {
    if (item.type === "file" && /\.wav$/i.test(item.name)) {
      // download_url is a raw URL perfect for <audio src="">
      if (item.download_url) {
        wavFiles.push({
          title: filenameToTitle(item.name),
          url: item.download_url,
          name: item.name
        });
      }
    } else if (RECURSIVE && item.type === "dir") {
      folders.push(item.path);
    }
  }

  if (RECURSIVE && folders.length) {
    for (const folderPath of folders) {
      const nested = await findWavsInDir(folderPath);
      wavFiles.push(...nested);
    }
  }

  return wavFiles;
}

async function loadSongs() {
  listEl.innerHTML = "";
  setStatus("Scanning repo for .wav files…");

  const wavs = await findWavsInDir(SONGS_PATH);

  // Sort A→Z by filename (optional)
  wavs.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  if (!wavs.length) {
    setStatus("No .wav files found in /songs.");
    return;
  }

  setStatus(`Found ${wavs.length} song(s).`);

  for (const song of wavs) {
    listEl.appendChild(createSongRow(song));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadSongs().catch(err => {
    console.error(err);
    setStatus(`Couldn’t load songs: ${err.message}`);
  });
});
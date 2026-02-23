// songs.js
// Tries to list audio files in /songs by using the GitHub contents API.
// If you ever hit rate limits, add a simple /songs/manifest.json and we'll prefer that automatically.

export const SONGS_PER_ALBUM_TOTAL = 52;

// Change these if you move the repo.
const OWNER = "itsbrd";
const REPO = "itsbrd.github.io";
const BRANCH = "main";
const SONGS_DIR = "songs";

function cleanTitle(filename) {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function tryFetchJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  return await res.json();
}

export async function getSongsList() {
  // Prefer a manifest if present
  const manifest = await tryFetchJson(`${SONGS_DIR}/manifest.json`);
  if (Array.isArray(manifest) && manifest.length) {
    return manifest.map((s) => ({
      title: s.title ?? cleanTitle(String(s.file ?? "")),
      file: s.file
    })).filter(s => s.file);
  }

  // Otherwise use GitHub API
  const api = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${SONGS_DIR}?ref=${BRANCH}`;
  const data = await tryFetchJson(api);
  if (!Array.isArray(data)) return [];

  const audio = data
    .filter((x) => x && x.type === "file")
    .map((x) => x.name)
    .filter((name) => /\.(mp3|wav|m4a|ogg)$/i.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  return audio.map((name) => ({
    title: cleanTitle(name),
    file: `${SONGS_DIR}/${encodeURIComponent(name)}`
  }));
}

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/*
  Project Poop Chat
  - realtime message updates (postgres_changes)
  - "online now" counter (presence)
  - typing indicator (broadcast)
  - username saved in localStorage
*/

const SUPABASE_URL = "https://fauoohclvblciogeluiy.supabase.co";
const SUPABASE_ANON_KEY = "PASTE_YOUR_ANON_KEY_HERE";

const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.includes("PASTE_"));
const supabase = hasSupabase ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const logEl = document.getElementById("chat-log");
const formEl = document.getElementById("chat-form");
const inputEl = document.getElementById("chat-input");
const nameBtn = document.getElementById("name-btn");
const statusEl = document.getElementById("chat-status");
const typingEl = document.getElementById("typing");
const onlinePill = document.getElementById("online-pill");
const sendBtn = document.getElementById("send-btn");

const STORAGE_NAME_KEY = "pp_chat_name";
const STORAGE_ID_KEY = "pp_chat_client_id";

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function formatTime(iso) {
  if (!iso) return "";
  try { return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

function getClientId() {
  let id = localStorage.getItem(STORAGE_ID_KEY) || "";
  if (!id) {
    id = (crypto?.randomUUID?.() || String(Math.random()).slice(2)) + "-" + Date.now();
    localStorage.setItem(STORAGE_ID_KEY, id);
  }
  return id;
}

function getName() { return localStorage.getItem(STORAGE_NAME_KEY) || ""; }
function setName(name) {
  localStorage.setItem(STORAGE_NAME_KEY, name);
  nameBtn.textContent = `Name: ${name}`;
  if (channel) channel.track({ client_id: clientId, name, online_at: new Date().toISOString() }).catch(() => {});
}
function ensureName() {
  let name = getName();
  if (!name) {
    name = prompt("Pick a username:", "brd")?.trim() || "";
    if (!name) name = "anon";
    setName(name);
  } else {
    nameBtn.textContent = `Name: ${name}`;
  }
  return name;
}

const recentFingerprints = [];
function fingerprint(m) {
  const t = m.created_at ? Math.floor(new Date(m.created_at).getTime() / 2000) : 0;
  return `${m.name}|${m.text}|${t}`;
}

function addMessage(msg, { local = false } = {}) {
  const fp = fingerprint(msg);
  if (recentFingerprints.includes(fp)) return;
  recentFingerprints.push(fp);
  if (recentFingerprints.length > 30) recentFingerprints.shift();

  const row = document.createElement("div");
  row.className = "msg" + (local ? " local" : "");

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  bubble.innerHTML = `
    <div class="meta">
      <span class="name">${escapeHtml(msg.name || "anon")}</span>
      <span class="time">${escapeHtml(formatTime(msg.created_at))}</span>
    </div>
    <div class="text">${escapeHtml(msg.text || "")}</div>
  `;

  row.appendChild(bubble);
  logEl.appendChild(row);
  logEl.scrollTop = logEl.scrollHeight;
}

let channel = null;
const clientId = getClientId();

const typingState = new Map();
let typingTimeout = null;
let typingLastBroadcast = 0;

function renderTyping() {
  const now = Date.now();
  for (const [id, v] of typingState.entries()) {
    if (now - v.ts > 2500) typingState.delete(id);
  }
  const names = [...typingState.values()].map(v => v.name).filter(n => n && n !== getName());
  if (names.length === 0) { typingEl.textContent = ""; return; }
  const list = names.slice(0, 3);
  const suffix = names.length > 3 ? ` +${names.length - 3} more` : "";
  typingEl.textContent = `${list.join(", ")}${suffix} typing…`;
}

function setOnlineCount(n) { if (onlinePill) onlinePill.textContent = `${n} online`; }

function computeOnlineCount(state) {
  const unique = new Set();
  Object.values(state || {}).forEach((metas) => {
    (metas || []).forEach((m) => unique.add(m?.client_id || JSON.stringify(m || {})));
  });
  return unique.size;
}

function safeStatus(msg, clearMs = 1200) {
  statusEl.textContent = msg || "";
  if (msg) setTimeout(() => (statusEl.textContent = ""), clearMs);
}

nameBtn.addEventListener("click", () => {
  const current = getName() || "anon";
  const next = prompt("Change username:", current)?.trim();
  if (next) setName(next);
});

inputEl.addEventListener("input", () => {
  if (!hasSupabase || !channel) return;
  const now = Date.now();
  if (now - typingLastBroadcast < 500) return;
  typingLastBroadcast = now;

  channel.send({
    type: "broadcast",
    event: "typing",
    payload: { client_id: clientId, name: ensureName(), ts: now }
  }).catch(() => {});
});

formEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = ensureName();
  const text = inputEl.value.trim();
  if (!text) return;

  inputEl.value = "";
  inputEl.focus();

  addMessage({ name, text, created_at: new Date().toISOString() }, { local: true });

  if (!hasSupabase) { safeStatus("Local-only (no Supabase key yet)."); return; }

  sendBtn.disabled = true;
  try {
    const { error } = await supabase.from("messages").insert({ name, text });
    if (error) {
      console.error(error);
      statusEl.textContent = `Send failed: ${error.message}`;
    }
  } finally {
    sendBtn.disabled = false;
  }
});

async function start() {
  ensureName();

  if (!hasSupabase) {
    statusEl.textContent = "Add your Supabase anon key in chat.js to enable realtime + storage.";
    return;
  }

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(150);

  if (error) {
    console.error(error);
    statusEl.textContent = `Load failed: ${error.message}`;
    return;
  }

  logEl.innerHTML = "";
  data.forEach(addMessage);

  channel = supabase
    .channel("pp-chat", { config: { presence: { key: clientId } } })
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
      addMessage(payload.new);
    })
    .on("presence", { event: "sync" }, () => setOnlineCount(computeOnlineCount(channel.presenceState())))
    .on("presence", { event: "join" }, () => setOnlineCount(computeOnlineCount(channel.presenceState())))
    .on("presence", { event: "leave" }, () => setOnlineCount(computeOnlineCount(channel.presenceState())))
    .on("broadcast", { event: "typing" }, ({ payload }) => {
      if (!payload?.client_id || payload.client_id === clientId) return;
      typingState.set(payload.client_id, { name: payload.name || "anon", ts: payload.ts || Date.now() });
      renderTyping();
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(renderTyping, 600);
    });

  channel.subscribe(async (s) => {
    if (s === "SUBSCRIBED") {
      await channel.track({ client_id: clientId, name: getName() || "anon", online_at: new Date().toISOString() });
      safeStatus("Connected.");
    } else if (s === "CHANNEL_ERROR") {
      statusEl.textContent = "Realtime connection error.";
    }
  });
}

start();

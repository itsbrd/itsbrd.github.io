import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://fauoohclvblciogeluiy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdW9vaGNsdmJsY2lvZ2VsdWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MTAzNzgsImV4cCI6MjA4NzE4NjM3OH0.uZlfIOpsf6ezDPfh9LhONsY2DsDQ9RQf2IRec1WXYWE";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const logEl = document.getElementById("chat-log");
const formEl = document.getElementById("chat-form");
const inputEl = document.getElementById("chat-input");
const nameBtn = document.getElementById("name-btn");
const typingEl = document.getElementById("typing");
const onlinePill = document.getElementById("online-pill");
const userListEl = document.getElementById("user-list");
const statusEl = document.getElementById("chat-status");

const STORAGE_NAME = "pp_chat_name";
const SESSION_ID = crypto?.randomUUID?.() || String(Math.random()).slice(2);

const REACTION_EMOJIS = ["👍", "🔥", "💀"];
const msgDomById = new Map(); // message_id -> { row, counts: Map(emoji->span) }

function safeStatus(msg){
  if(statusEl) statusEl.textContent = msg || "";
}

function escapeHtml(str){
  return String(str).replace(/[&<>"]/g, c => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;"
  }[c]));
}

function colorFromName(name){
  let hash = 0;
  for(let i=0;i<name.length;i++){
    hash = name.charCodeAt(i) + ((hash<<5) - hash);
  }
  const hue = ((hash % 360) + 360) % 360;
  return `hsl(${hue},70%,60%)`;
}

function formatTime(t){
  return new Date(t).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
}

function looksLikeImageUrl(text){
  try{
    const u = new URL(text);
    return /\.(png|jpg|jpeg|gif|webp)$/i.test(u.pathname);
  }catch{ return false; }
}

function youtubeEmbedFromUrl(text){
  try{
    const u = new URL(text);
    if(u.hostname.includes("youtu.be")){
      const id = u.pathname.replace("/","");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if(u.hostname.includes("youtube.com")){
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    return null;
  }catch{ return null; }
}

function renderMessageText(text){
  const trimmed = text.trim();

  if(looksLikeImageUrl(trimmed)){
    return `<img src="${trimmed}" alt="image"/>`;
  }

  const yt = youtubeEmbedFromUrl(trimmed);
  if(yt){
    return `<iframe width="320" height="180" src="${yt}" frameborder="0" allowfullscreen></iframe>`;
  }

  return escapeHtml(trimmed);
}

function getName(){
  return localStorage.getItem(STORAGE_NAME) || "";
}

function setName(n){
  localStorage.setItem(STORAGE_NAME, n);
  nameBtn.textContent = `Name: ${n}`;
}

function ensureName(){
  let n = getName();
  if(!n){
    n = prompt("Pick username", "anon") || "anon";
    setName(n);
  }
  return n;
}

nameBtn?.addEventListener("click", () => {
  const n = prompt("Pick username", getName() || "anon");
  if(n) setName(n);
});

// ---------- Reactions UI helpers ----------
function makeReactionBar(messageId){
  const bar = document.createElement("div");
  bar.className = "reactions";

  const counts = new Map();

  for(const emoji of REACTION_EMOJIS){
    const btn = document.createElement("button");
    btn.className = "react-btn";
    btn.type = "button";
    btn.innerHTML = `<span class="emoji">${emoji}</span><span class="react-count" data-emoji="${emoji}">0</span>`;
    const countSpan = btn.querySelector(".react-count");
    counts.set(emoji, countSpan);

    btn.addEventListener("click", async () => {
      const name = ensureName();
      if(!messageId){
        safeStatus("Can't react: message missing id.");
        return;
      }
      // optimistic bump
      bumpReactionCount(messageId, emoji, 1);

      const { error } = await supabase.from("reactions").insert({
        message_id: messageId,
        emoji,
        name
      });

      if(error){
        // roll back optimistic bump
        bumpReactionCount(messageId, emoji, -1);
        console.error("[Reactions] insert error:", error);
        safeStatus("Reactions table missing? (Run the SQL I sent.)");
      }
    });

    bar.appendChild(btn);
  }

  return { bar, counts };
}

function bumpReactionCount(messageId, emoji, delta){
  const entry = msgDomById.get(messageId);
  if(!entry) return;
  const span = entry.counts.get(emoji);
  if(!span) return;
  const current = Number(span.textContent) || 0;
  const next = Math.max(0, current + delta);
  span.textContent = String(next);
}

function setReactionCount(messageId, emoji, value){
  const entry = msgDomById.get(messageId);
  if(!entry) return;
  const span = entry.counts.get(emoji);
  if(!span) return;
  span.textContent = String(value ?? 0);
}

// ---------- Message rendering ----------
function addMessage(msg, local=false){
  const row = document.createElement("div");
  row.className = "msg" + (local ? " local" : "");

  const safeName = msg?.name ?? "anon";
  const created = msg?.created_at ?? new Date().toISOString();
  const msgId = msg?.id ?? null;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = `
    <div class="meta">
      <span class="name" style="color:${colorFromName(safeName)}">${escapeHtml(safeName)}</span>
      <span class="time">${formatTime(created)}</span>
    </div>
    <div class="text">${renderMessageText(msg?.text ?? "")}</div>
  `;

  // reactions
  const { bar, counts } = makeReactionBar(msgId);
  bubble.appendChild(bar);

  row.appendChild(bubble);
  logEl.appendChild(row);

  if(msgId != null){
    msgDomById.set(msgId, { row, counts });
  }

  logEl.scrollTop = logEl.scrollHeight;
}

// ---------- Slash commands ----------
function handleSlashCommand(text){
  const t = text.trim();

  if(t.startsWith("/nick")){
    const newName = t.split(/\s+/)[1];
    if(newName){
      setName(newName);
      safeStatus("Name changed.");
    }else{
      safeStatus("Usage: /nick yourname");
    }
    return true;
  }

  if(t === "/clear"){
    logEl.innerHTML = "";
    safeStatus("Cleared.");
    return true;
  }

  if(t === "/shrug"){
    inputEl.value = "¯\\_(ツ)_/¯";
    return true;
  }

  return false;
}

// ---------- Typing indicator ----------
let typingTimer = null;
function setTyping(isTyping){
  const name = ensureName();
  // presence payload (we store typing state there)
  if(chatChannel){
    chatChannel.track({ name, session: SESSION_ID, typing: !!isTyping, ts: Date.now() });
  }
}

inputEl?.addEventListener("input", () => {
  setTyping(true);
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => setTyping(false), 900);
});

// ---------- Send message ----------
formEl?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = ensureName();
  const text = (inputEl.value || "").trim();
  if(!text) return;

  if(text.startsWith("/") && handleSlashCommand(text)){
    return;
  }

  inputEl.value = "";
  setTyping(false);

  // Insert and request id back so reactions work immediately
  const { data, error } = await supabase
    .from("messages")
    .insert({ name, text })
    .select()
    .single();

  if(error){
    console.error("[Messages] insert error:", error);
    safeStatus("Couldn't send. Check console / Supabase tables.");
    return;
  }

  // Local echo (realtime will also deliver; but we add now for instant feel)
  addMessage(data, true);
});

// ---------- Presence (online list + typing) ----------
let chatChannel = null;

function updatePresenceUI(state){
  // state = presenceState() object: { key: [{...}, {...}] }
  const users = [];

  Object.values(state).forEach((sessions) => {
    sessions.forEach((s) => {
      if(s?.name) users.push({ name: s.name, typing: !!s.typing, session: s.session });
    });
  });

  // Deduplicate by name (if same person has multiple tabs)
  const map = new Map();
  for(const u of users){
    if(!map.has(u.name)) map.set(u.name, u);
  }
  const unique = Array.from(map.values()).sort((a,b)=>a.name.localeCompare(b.name));

  onlinePill.textContent = `${unique.length} online`;
  userListEl.innerHTML = unique.map(u => `
    <div class="user-pill">
      <span class="dot"></span>
      <span style="color:${colorFromName(u.name)}">${escapeHtml(u.name)}</span>
    </div>
  `).join("");

  // Typing line
  const typers = unique.filter(u => u.typing).map(u => u.name);
  if(typers.length === 0){
    typingEl.textContent = "";
  }else if(typers.length === 1){
    typingEl.textContent = `${typers[0]} typing…`;
  }else if(typers.length === 2){
    typingEl.textContent = `${typers[0]} and ${typers[1]} typing…`;
  }else{
    typingEl.textContent = `${typers.slice(0,2).join(", ")} and ${typers.length-2} more typing…`;
  }
}

// ---------- Load history + reactions ----------
async function loadHistory(){
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(100);

  if(error){
    console.error("[Messages] load error:", error);
    safeStatus("Couldn't load messages.");
    return [];
  }

  data.forEach(m => addMessage(m, false));
  return data;
}

async function loadReactionsForMessages(messages){
  const ids = messages.map(m => m.id).filter(id => id != null);
  if(ids.length === 0) return;

  const { data, error } = await supabase
    .from("reactions")
    .select("message_id,emoji")
    .in("message_id", ids);

  if(error){
    console.warn("[Reactions] load error:", error);
    safeStatus("No reactions table yet? Run the SQL to add it.");
    return;
  }

  // aggregate
  const agg = new Map(); // key `${mid}|${emoji}` -> count
  for(const r of data){
    const key = `${r.message_id}|${r.emoji}`;
    agg.set(key, (agg.get(key) || 0) + 1);
  }

  for(const [key, count] of agg.entries()){
    const [midStr, emoji] = key.split("|");
    const mid = Number(midStr);
    setReactionCount(mid, emoji, count);
  }
}

// ---------- Realtime subscriptions ----------
function subscribeRealtime(){
  supabase
    .channel("chat-messages")
    .on("postgres_changes", { event:"INSERT", schema:"public", table:"messages" }, (payload) => {
      // Avoid double-echo: if we already rendered this id, skip
      const msg = payload.new;
      if(msg?.id != null && msgDomById.has(msg.id)) return;
      addMessage(msg, false);
    })
    .subscribe();

  supabase
    .channel("chat-reactions")
    .on("postgres_changes", { event:"INSERT", schema:"public", table:"reactions" }, (payload) => {
      const r = payload.new;
      if(!r?.message_id || !r?.emoji) return;
      bumpReactionCount(r.message_id, r.emoji, 1);
    })
    .subscribe();
}

async function initPresence(){
  const name = ensureName();

  chatChannel = supabase.channel("chat-presence", {
    config: { presence: { key: name } }
  });

  chatChannel.on("presence", { event: "sync" }, () => {
    const state = chatChannel.presenceState();
    updatePresenceUI(state);
  });

  chatChannel.on("presence", { event: "join" }, () => {
    const state = chatChannel.presenceState();
    updatePresenceUI(state);
  });

  chatChannel.on("presence", { event: "leave" }, () => {
    const state = chatChannel.presenceState();
    updatePresenceUI(state);
  });

  await chatChannel.subscribe(async (status) => {
    if(status === "SUBSCRIBED"){
      await chatChannel.track({ name, session: SESSION_ID, typing: false, ts: Date.now() });
      updatePresenceUI(chatChannel.presenceState());
    }
  });
}

// ---------- Boot ----------
(async function boot(){
  safeStatus("");

  const messages = await loadHistory();
  await loadReactionsForMessages(messages);

  subscribeRealtime();
  initPresence();
})();

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// TODO: paste your new project values here
const SUPABASE_URL = "https://fauoohclvblciogeluiy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdW9vaGNsdmJsY2lvZ2VsdWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MTAzNzgsImV4cCI6MjA4NzE4NjM3OH0.uZlfIOpsf6ezDPfh9LhONsY2DsDQ9RQf2IRec1WXYWE";


import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const hasSupabase = SUPABASE_URL && SUPABASE_ANON_KEY;
const supabase = hasSupabase ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const logEl = document.getElementById("chat-log");
const formEl = document.getElementById("chat-form");
const inputEl = document.getElementById("chat-input");
const nameBtn = document.getElementById("name-btn");
const statusEl = document.getElementById("chat-status");

function getName() {
  return localStorage.getItem("pp_chat_name") || "";
}
function setName(name) {
  localStorage.setItem("pp_chat_name", name);
  nameBtn.textContent = `Name: ${name}`;
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

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function addMessage({ name, text, created_at }, { local = false } = {}) {
  const row = document.createElement("div");
  row.className = "msg" + (local ? " local" : "");
  const time = created_at ? new Date(created_at).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}) : "";
  row.innerHTML = `
    <div class="meta">
      <span class="name">${escapeHtml(name || "anon")}</span>
      <span class="time">${escapeHtml(time)}</span>
    </div>
    <div class="text">${escapeHtml(text || "")}</div>
  `;
  logEl.appendChild(row);
  logEl.scrollTop = logEl.scrollHeight;
}

nameBtn.addEventListener("click", () => {
  const current = getName() || "anon";
  const next = prompt("Change username:", current)?.trim();
  if (next) setName(next);
});

formEl.addEventListener("submit", async (e) => {
  e.preventDefault(); // ✅ stops page refresh
  const name = ensureName();
  const text = inputEl.value.trim();
  if (!text) return;

  inputEl.value = "";
  inputEl.focus();

  // show immediately
  addMessage({ name, text, created_at: new Date().toISOString() }, { local: true });

  // send to supabase if enabled
  if (!hasSupabase) {
    statusEl.textContent = "Local-only (no Supabase configured).";
    return;
  }

  const { error } = await supabase.from("messages").insert({ name, text });
  if (error) {
    console.error(error);
    statusEl.textContent = `Send failed: ${error.message}`;
  } else {
    statusEl.textContent = "";
  }
});

async function start() {
  ensureName();

  if (!hasSupabase) {
    statusEl.textContent = "Supabase not configured yet.";
    return;
  }

  // load last messages
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    console.error(error);
    statusEl.textContent = `Load failed: ${error.message}`;
    return;
  }

  logEl.innerHTML = "";
  data.forEach((m) => addMessage(m));

  // realtime subscribe
  supabase
    .channel("pp-chat")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
      addMessage(payload.new);
    })
    .subscribe((s) => {
      if (s === "SUBSCRIBED") statusEl.textContent = "Connected.";
      setTimeout(() => (statusEl.textContent = ""), 800);
    });
}

start();

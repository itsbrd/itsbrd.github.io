import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Supabase connection
const SUPABASE_URL = "https://fauoohclvblciogeluiy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdW9vaGNsdmJsY2lvZ2VsdWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MTAzNzgsImV4cCI6MjA4NzE4NjM3OH0.uZlfIOpsf6ezDPfh9LhONsY2DsDQ9RQf2IRec1WXYWE";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
    name = prompt("Pick a username:", "anon") || "anon";
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

function addMessage({ username, message, created_at }, { local = false } = {}) {
  const row = document.createElement("div");
  row.className = "msg" + (local ? " local" : "");

  const time = created_at
    ? new Date(created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  row.innerHTML = `
    <div class="meta">
      <span class="name">${escapeHtml(username)}</span>
      <span class="time">${escapeHtml(time)}</span>
    </div>
    <div class="text">${escapeHtml(message)}</div>
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
  e.preventDefault();

  const username = ensureName();
  const message = inputEl.value.trim();

  if (!message) return;

  inputEl.value = "";
  inputEl.focus();

  addMessage(
    { username, message, created_at: new Date().toISOString() },
    { local: true }
  );

  const { error } = await supabase
    .from("chat_messages")
    .insert({ username, message });

  if (error) {
    console.error(error);
    statusEl.textContent = `Send failed: ${error.message}`;
  }
});

async function start() {
  ensureName();

  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    statusEl.textContent = `Load failed: ${error.message}`;
    return;
  }

  logEl.innerHTML = "";
  data.forEach(addMessage);

  supabase
    .channel("pp-chat")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "chat_messages" },
      (payload) => addMessage(payload.new)
    )
    .subscribe();
}

start();

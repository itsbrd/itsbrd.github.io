import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// TODO: paste your new project values here
const SUPABASE_URL = "https://fauoohclvblciogeluiy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdW9vaGNsdmJsY2lvZ2VsdWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MTAzNzgsImV4cCI6MjA4NzE4NjM3OH0.uZlfIOpsf6ezDPfh9LhONsY2DsDQ9RQf2IRec1WXYWE";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const messagesEl = document.getElementById("messages");
const formEl = document.getElementById("chat-form");
const inputEl = document.getElementById("message");
const statusEl = document.getElementById("status");
const changeNameBtn = document.getElementById("change-name");

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function getUsername() {
  let name = localStorage.getItem("pp_chat_name");
  if (!name) name = promptForName();
  return name;
}

function promptForName() {
  let name = prompt("Pick a username:", "itsbrd");
  if (!name) name = "anon";
  name = name.trim().slice(0, 20) || "anon";
  localStorage.setItem("pp_chat_name", name);
  return name;
}

function appendMessageRow(row, { scroll = false } = {}) {
  const div = document.createElement("div");
  div.className = "msg";
  div.innerHTML = `
    <div class="meta">
      <div class="user">${escapeHtml(row.username)}</div>
      <div class="time">${escapeHtml(formatTime(row.created_at))}</div>
    </div>
    <div class="text">${escapeHtml(row.message)}</div>
  `;
  messagesEl.appendChild(div);

  if (scroll) {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
}

async function loadRecent() {
  statusEl.textContent = "Loading…";
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, created_at, username, message")
    .order("created_at", { ascending: true })
    .limit(150);

  if (error) {
    console.error(error);
    statusEl.textContent = `Error loading chat: ${error.message}`;
    return;
  }

  messagesEl.innerHTML = "";
  for (const row of data) appendMessageRow(row);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  statusEl.textContent = "";
}

function subscribeRealtime() {
  supabase
    .channel("pp-chat")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "chat_messages" },
      (payload) => {
        appendMessageRow(payload.new, { scroll: true });
      }
    )
    .subscribe((state) => {
      // optional debug
      // console.log("Realtime:", state);
    });
}

async function sendMessage(text) {
  const username = getUsername();

  const message = text.trim();
  if (!message) return;

  // tiny safety limits even for friends
  const clean = message.slice(0, 200);

  const { error } = await supabase.from("chat_messages").insert({
    username,
    message: clean
  });

  if (error) {
    console.error(error);
    statusEl.textContent = `Send failed: ${error.message}`;
    return;
  }

  statusEl.textContent = "";
}

changeNameBtn.addEventListener("click", () => {
  promptForName();
});

formEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = inputEl.value;

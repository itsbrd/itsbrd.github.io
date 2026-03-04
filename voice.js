// voice.js (module)
// Multi-user WebRTC voice using Supabase Realtime broadcast + presence signaling.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://fauoohclvblciogeluiy.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdW9vaGNsdmJsY2lvZ2VsdWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MTAzNzgsImV4cCI6MjA4NzE4NjM3OH0.uZlfIOpsf6ezDPfh9LhONsY2DsDQ9RQf2IRec1WXYWE";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const STORAGE_NAME = "pp_chat_name";
const PEER_ID =
  sessionStorage.getItem("pp_voice_peer_id") ||
  (crypto?.randomUUID?.() || String(Math.random()).slice(2));
sessionStorage.setItem("pp_voice_peer_id", PEER_ID);

const voiceBtn = document.getElementById("voice-btn");
const voiceStatusEl = document.getElementById("voice-status");
const voiceUsersEl = document.getElementById("voice-users");
const audioBin = document.getElementById("voice-audios");

let voiceChannel = null;
let localStream = null;
let pcs = new Map(); // peerId -> RTCPeerConnection
let activePeers = new Map(); // peerId -> { name, voice }

function getName() {
  return localStorage.getItem(STORAGE_NAME) || "anon";
}

function setVoiceStatus(text) {
  if (voiceStatusEl) voiceStatusEl.textContent = text;
}

function renderVoiceUsers() {
  if (!voiceUsersEl) return;
  voiceUsersEl.innerHTML = "";

  // show only peers in voice + yourself if in voice
  const list = [];

  if (localStream) {
    list.push({ peerId: PEER_ID, name: getName(), self: true });
  }

  for (const [peerId, meta] of activePeers.entries()) {
    if (meta?.voice) list.push({ peerId, name: meta.name || "anon", self: false });
  }

  // stable sort by name-ish
  list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  for (const u of list) {
    const row = document.createElement("div");
    row.className = "user-pill";
    row.innerHTML = `
      <span class="dot ${u.self ? "dot-self" : "dot-voice"}"></span>
      <span>${u.self ? `${u.name} (you)` : u.name}</span>
    `;
    voiceUsersEl.appendChild(row);
  }
}

function stopAndCleanup() {
  for (const [, pc] of pcs.entries()) {
    try {
      pc.close();
    } catch {}
  }
  pcs.clear();

  // remove remote audio elements
  if (audioBin) audioBin.innerHTML = "";

  if (localStream) {
    localStream.getTracks().forEach((t) => t.stop());
    localStream = null;
  }

  if (voiceChannel) {
    try {
      voiceChannel.unsubscribe();
    } catch {}
    voiceChannel = null;
  }

  setVoiceStatus("Voice: off");
  renderVoiceUsers();
}

function ensureAudioEl(peerId) {
  if (!audioBin) return null;
  let el = document.getElementById(`voice-audio-${peerId}`);
  if (!el) {
    el = document.createElement("audio");
    el.id = `voice-audio-${peerId}`;
    el.autoplay = true;
    el.playsInline = true;
    // keep hidden; it still plays audio
    el.style.display = "none";
    audioBin.appendChild(el);
  }
  return el;
}

function sendSignal(toPeerId, payload) {
  if (!voiceChannel) return;
  voiceChannel.send({
    type: "broadcast",
    event: "signal",
    payload: {
      from: PEER_ID,
      to: toPeerId,
      name: getName(),
      ...payload,
    },
  });
}

function newPeerConnection(peerId) {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  // send our audio
  if (localStream) {
    for (const track of localStream.getTracks()) {
      pc.addTrack(track, localStream);
    }
  }

  pc.onicecandidate = (e) => {
    if (e.candidate) {
      sendSignal(peerId, { kind: "ice", candidate: e.candidate });
    }
  };

  pc.ontrack = (e) => {
    const audioEl = ensureAudioEl(peerId);
    if (audioEl) audioEl.srcObject = e.streams[0];
  };

  pc.onconnectionstatechange = () => {
    // optional: you could surface state here
    // console.log("[Voice] state", peerId, pc.connectionState);
  };

  pcs.set(peerId, pc);
  return pc;
}

async function ensureOfferTo(peerId) {
  if (!localStream) return;
  if (peerId === PEER_ID) return;

  let pc = pcs.get(peerId);
  if (!pc) pc = newPeerConnection(peerId);

  // create offer
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  sendSignal(peerId, { kind: "offer", sdp: pc.localDescription });
}

async function handleOffer(fromPeerId, sdp) {
  if (!localStream) return;

  let pc = pcs.get(fromPeerId);
  if (!pc) pc = newPeerConnection(fromPeerId);

  await pc.setRemoteDescription(sdp);

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  sendSignal(fromPeerId, { kind: "answer", sdp: pc.localDescription });
}

async function handleAnswer(fromPeerId, sdp) {
  const pc = pcs.get(fromPeerId);
  if (!pc) return;
  await pc.setRemoteDescription(sdp);
}

async function handleIce(fromPeerId, candidate) {
  const pc = pcs.get(fromPeerId);
  if (!pc) return;
  try {
    await pc.addIceCandidate(candidate);
  } catch (e) {
    console.warn("[Voice] addIceCandidate failed:", e);
  }
}

function updateActivePeersFromPresence(state) {
  // state shape: { key: [ { ...payload } ] }
  // keys here will be presence "key" value. We’ll store peerId in payload.
  activePeers.clear();

  for (const key of Object.keys(state || {})) {
    const entries = state[key] || [];
    for (const p of entries) {
      if (!p?.peerId) continue;
      if (p.peerId === PEER_ID) continue;
      activePeers.set(p.peerId, { name: p.name || key, voice: !!p.voice });
    }
  }

  renderVoiceUsers();

  // If we’re in voice, connect to peers in voice.
  if (localStream) {
    for (const [peerId, meta] of activePeers.entries()) {
      if (!meta.voice) continue;

      // Deterministic initiator rule to avoid “double offers”:
      // higher peerId initiates
      if (String(PEER_ID) > String(peerId)) {
        // initiate connection if not already
        if (!pcs.has(peerId)) ensureOfferTo(peerId);
      }
    }

    // close connections to peers who left voice
    for (const [peerId] of pcs.entries()) {
      const meta = activePeers.get(peerId);
      if (!meta || !meta.voice) {
        try {
          pcs.get(peerId)?.close();
        } catch {}
        pcs.delete(peerId);
      }
    }
  }
}

async function joinVoice() {
  // Must be called from a click (user gesture) for Safari mic permissions.
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true });

  setVoiceStatus("Voice: connecting…");

  voiceChannel = supabase.channel("pp-voice", {
    config: {
      presence: { key: getName() },
      broadcast: { self: false },
    },
  });

  voiceChannel.on("presence", { event: "sync" }, () => {
    updateActivePeersFromPresence(voiceChannel.presenceState());
  });
  voiceChannel.on("presence", { event: "join" }, () => {
    updateActivePeersFromPresence(voiceChannel.presenceState());
  });
  voiceChannel.on("presence", { event: "leave" }, () => {
    updateActivePeersFromPresence(voiceChannel.presenceState());
  });

  voiceChannel.on("broadcast", { event: "signal" }, async ({ payload }) => {
    try {
      const { from, to, kind, sdp, candidate } = payload || {};
      if (!from || to !== PEER_ID) return;

      if (kind === "offer") {
        await handleOffer(from, sdp);
      } else if (kind === "answer") {
        await handleAnswer(from, sdp);
      } else if (kind === "ice") {
        await handleIce(from, candidate);
      }
    } catch (e) {
      console.error("[Voice] signal error:", e);
    }
  });

  await voiceChannel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      await voiceChannel.track({
        name: getName(),
        peerId: PEER_ID,
        voice: true,
        ts: Date.now(),
      });

      setVoiceStatus("Voice: on");
      updateActivePeersFromPresence(voiceChannel.presenceState());
      renderVoiceUsers();
    }
  });

  voiceBtn.textContent = "Leave Voice";
  voiceBtn.classList.add("btn-on");
}

async function leaveVoice() {
  // untrack
  try {
    await voiceChannel?.untrack();
  } catch {}

  stopAndCleanup();

  voiceBtn.textContent = "Join Voice";
  voiceBtn.classList.remove("btn-on");
}

voiceBtn?.addEventListener("click", async () => {
  try {
    if (!localStream) {
      await joinVoice();
    } else {
      await leaveVoice();
    }
  } catch (e) {
    console.error("[Voice] join/leave error:", e);
    alert("Voice failed. Check mic permission + HTTPS.");
    stopAndCleanup();
    voiceBtn.textContent = "Join Voice";
    voiceBtn.classList.remove("btn-on");
  }
});

// initial UI
setVoiceStatus("Voice: off");
renderVoiceUsers();

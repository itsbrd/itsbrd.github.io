let localStream = null;
let peers = {};

const voiceBtn = document.getElementById("voice-btn");

voiceBtn.addEventListener("click", async () => {

  if (!localStream) {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      voiceBtn.textContent = "Leave Voice";

      // notify chat
      sendSystemMessage("🎤 joined voice");

    } catch (err) {
      alert("Microphone permission denied.");
      return;
    }

  } else {

    localStream.getTracks().forEach(track => track.stop());
    localStream = null;

    voiceBtn.textContent = "Join Voice";

    sendSystemMessage("🎤 left voice");
  }

});

function sendSystemMessage(text) {
  const log = document.getElementById("chat-log");

  const msg = document.createElement("div");
  msg.className = "system-msg";
  msg.textContent = text;

  log.appendChild(msg);
  log.scrollTop = log.scrollHeight;
}

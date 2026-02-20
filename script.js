// Local song progress
let songsFound = Number(localStorage.getItem("pp_songsfound")) || 0;


// Song List
const songList = [
  { title: "PROJECT POOP", file: "theme.mp3" },
  { title: "PROJECT PISS", file: "projectpiss.mp3" },
  { title: "PROJECT POOP 2", file: "pp2.mp3" },
  { title: "ALL AGAIN", file: "allagain.mp3" }
];


document.addEventListener("DOMContentLoaded", () => {

  updateSongsFound();
  buildPlaylist();

});


// Update counter
function updateSongsFound() {

  document.getElementById("songs-found").textContent =
    `Songs Found: ${songsFound}/52`;

  localStorage.setItem("pp_songsfound", songsFound);

}


// Build players
function buildPlaylist() {

  const heroStack = document.querySelector(".hero-stack");

  const container = document.createElement("div");
  container.className = "playlist";

  heroStack.appendChild(container);


  songList.forEach((song) => {

    const wrapper = document.createElement("div");
    wrapper.className = "audio-wrapper";

    wrapper.innerHTML = `
      <h4>${song.title}</h4>

      <audio src="${song.file}"></audio>

      <div class="timeline">
        <div class="progress"></div>
      </div>

      <div class="time-info">
        <span class="current">0:00</span> /
        <span class="duration">0:00</span>
      </div>

      <button>▶️</button>
    `;

    container.appendChild(wrapper);


    const audio = wrapper.querySelector("audio");
    const button = wrapper.querySelector("button");

    const timeline = wrapper.querySelector(".timeline");
    const progress = wrapper.querySelector(".progress");

    const current = wrapper.querySelector(".current");
    const duration = wrapper.querySelector(".duration");


    // Metadata
    audio.addEventListener("loadedmetadata", () => {
      duration.textContent = formatTime(audio.duration);
    });


    // Progress
    audio.addEventListener("timeupdate", () => {

      const percent =
        (audio.currentTime / audio.duration) * 100;

      progress.style.width = percent + "%";

      current.textContent = formatTime(audio.currentTime);

    });


    // Seek
    timeline.addEventListener("click", (e) => {

      const rect = timeline.getBoundingClientRect();
      const x = e.clientX - rect.left;

      const percent = x / rect.width;

      audio.currentTime = percent * audio.duration;

    });


    // Play / Pause
    button.addEventListener("click", () => {

      document.querySelectorAll("audio").forEach(a => {
        if (a !== audio) a.pause();
      });

      document.querySelectorAll(".audio-wrapper button")
        .forEach(b => b.textContent = "▶️");


      if (audio.paused) {
        audio.play();
        button.textContent = "⏸️";
      } else {
        audio.pause();
        button.textContent = "▶️";
      }

    });


    // Finished
    audio.addEventListener("ended", () => {
      button.textContent = "▶️";
    });

  });

}


// Format time
function formatTime(time) {

  const min = Math.floor(time / 60);
  const sec = Math.floor(time % 60).toString().padStart(2, "0");

  return `${min}:${sec}`;

}


// Resize safety
window.addEventListener("resize", () => {

  const bg = document.querySelector(".background-gif");

  if (bg) {
    bg.style.width = "100vw";
    bg.style.height = "100vh";
  }

});

document.addEventListener("DOMContentLoaded", () => {

  const container = document.querySelector(".hero-stack");


  function formatTime(t) {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }


  songs.forEach((song, i) => {

    const wrap = document.createElement("div");
    wrap.className = "audio-wrapper";


    wrap.innerHTML = `

      <h4>${song.title}</h4>

      <audio src="${song.file}"></audio>

      <div class="timeline">
        <div class="progress"></div>
      </div>

      <div class="controls">

        <button class="play-btn">▶️</button>

        <div class="time">
          <span class="cur">0:00</span> /
          <span class="dur">0:00</span>
        </div>

      </div>

    `;


    container.appendChild(wrap);


    const audio = wrap.querySelector("audio");
    const play = wrap.querySelector(".play-btn");
    const progress = wrap.querySelector(".progress");
    const timeline = wrap.querySelector(".timeline");
    const cur = wrap.querySelector(".cur");
    const dur = wrap.querySelector(".dur");


    audio.addEventListener("loadedmetadata", () => {
      dur.textContent = formatTime(audio.duration);
    });


    audio.addEventListener("timeupdate", () => {

      const pct = (audio.currentTime / audio.duration) * 100;

      progress.style.width = pct + "%";

      cur.textContent = formatTime(audio.currentTime);

    });


    timeline.addEventListener("click", e => {

      const x = e.offsetX / timeline.offsetWidth;

      audio.currentTime = x * audio.duration;

    });


    play.addEventListener("click", () => {

      document.querySelectorAll("audio").forEach(a => {
        if (a !== audio) a.pause();
      });


      if (audio.paused) {
        audio.play();
        play.textContent = "⏸️";
      } else {
        audio.pause();
        play.textContent = "▶️";
      }

    });


    audio.addEventListener("ended", () => {
      play.textContent = "▶️";
    });

  });

});

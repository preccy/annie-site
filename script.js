// ====== Cute sound (no audio file) ======
let soundOn = true;
let audioReady = false;
let ctx = null;

function ensureAudio() {
  if (!soundOn) return false;
  if (audioReady && ctx) return true;

  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioReady = true;
    return true;
  } catch {
    // If audio is blocked/unavailable, just silently skip.
    soundOn = false;
    const btn = document.getElementById("toggleSound");
    if (btn) btn.textContent = "Sound: OFF";
    return false;
  }
}

function popSound() {
  if (!soundOn) return;
  if (!ensureAudio()) return;

  // Some browsers require a user gesture; this is called from hover/click
  if (ctx.state === "suspended") ctx.resume();

  const o = ctx.createOscillator();
  const g = ctx.createGain();

  o.type = "triangle";

  // quick "pop" pitch drop
  const now = ctx.currentTime;
  o.frequency.setValueAtTime(720, now);
  o.frequency.exponentialRampToValueAtTime(260, now + 0.07);

  // quick volume envelope
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

  o.connect(g);
  g.connect(ctx.destination);

  o.start(now);
  o.stop(now + 0.10);
}

function attachSfx() {
  // Hover sound for desktop, click sound for mobile
  document.querySelectorAll("[data-sfx]").forEach((el) => {
    el.addEventListener("mouseenter", () => popSound(), { passive: true });
    el.addEventListener("pointerdown", () => popSound(), { passive: true });
  });
}

// Toggle sound button
const soundBtn = document.getElementById("toggleSound");
if (soundBtn) {
  soundBtn.addEventListener("click", () => {
    soundOn = !soundOn;
    soundBtn.textContent = `Sound: ${soundOn ? "ON" : "OFF"}`;
    if (soundOn) ensureAudio();
  });
}

// Prime audio on first user interaction (helps mobile)
window.addEventListener("pointerdown", () => ensureAudio(), { once: true, passive: true });

// ===== Modal (notes) =====
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");
const modalClose = document.getElementById("modalClose");
const modalX = document.getElementById("modalX");
const modalOkay = document.getElementById("modalOkay");

function openModal(title, message){
  modalTitle.textContent = title;
  modalMessage.textContent = message;
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
}
function closeModal(){
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
}

modalClose.addEventListener("click", closeModal);
modalX.addEventListener("click", closeModal);
modalOkay.addEventListener("click", closeModal);

window.addEventListener("keydown", (e) => {
  if(e.key === "Escape") { closeModal(); closeLightbox(); }
});

document.querySelectorAll(".envelope").forEach(btn => {
  btn.addEventListener("click", () => {
    openModal(btn.dataset.title, btn.dataset.message);
  });
});

// Random surprise button picks one envelope
document.getElementById("openRandom").addEventListener("click", () => {
  const env = Array.from(document.querySelectorAll(".envelope"));
  const pick = env[Math.floor(Math.random() * env.length)];
  openModal(pick.dataset.title, pick.dataset.message);
});

// ===== Lightbox (photos) =====
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxCap = document.getElementById("lightboxCap");
const lightboxClose = document.getElementById("lightboxClose");

function openLightbox(src, cap){
  lightboxImg.src = src;
  lightboxCap.textContent = cap || "";
  lightbox.classList.add("show");
  lightbox.setAttribute("aria-hidden", "false");
}
function closeLightbox(){
  lightbox.classList.remove("show");
  lightbox.setAttribute("aria-hidden", "true");
  lightboxImg.src = "";
}

lightboxClose.addEventListener("click", closeLightbox);

document.querySelectorAll(".photo").forEach(fig => {
  fig.addEventListener("click", () => {
    openLightbox(fig.dataset.full, fig.dataset.caption);
  });
});

// ===== Reveal on scroll =====
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if(e.isIntersecting) e.target.classList.add("show");
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach(el => io.observe(el));

// ===== Sparkles + bubbles click particles =====
let particlesOn = true;
const toggleParticles = document.getElementById("toggleHearts");
toggleParticles.addEventListener("click", () => {
  particlesOn = !particlesOn;
  toggleParticles.textContent = `Sparkles: ${particlesOn ? "ON" : "OFF"}`;
});

const particleChars = ["✨","⭐","🫧","☁️","🎀","💙","💗","✦","✧"];

function spawnParticle(x, y){
  const p = document.createElement("div");
  p.className = "particle";
  p.textContent = particleChars[Math.floor(Math.random() * particleChars.length)];
  p.style.left = `${x}px`;
  p.style.top = `${y}px`;
  p.style.transform = `translate(-50%, -50%) rotate(${(Math.random()*24 - 12).toFixed(1)}deg)`;
  p.style.fontSize = `${14 + Math.floor(Math.random()*10)}px`;
  document.body.appendChild(p);
  setTimeout(() => p.remove(), 950);
}

window.addEventListener("pointerdown", (e) => {
  if(!particlesOn) return;

  // Don't spam particles when tapping key UI elements
  const tag = (e.target.tagName || "").toLowerCase();
  if (tag === "button" || tag === "img") return;

  // spawn a few for extra cute
  const n = 3 + Math.floor(Math.random()*3);
  for(let i=0;i<n;i++){
    const dx = (Math.random()*26 - 13);
    const dy = (Math.random()*26 - 13);
    spawnParticle(e.clientX + dx, e.clientY + dy);
  }
}, { passive: true });

// Mascot: clicking it gives a little burst + opens a sweet message
const mascot = document.getElementById("mascot");
if (mascot) {
  mascot.addEventListener("click", (e) => {
    const rect = mascot.getBoundingClientRect();
    const x = rect.left + rect.width/2;
    const y = rect.top + rect.height/2;

    for(let i=0;i<8;i++){
      const dx = (Math.random()*70 - 35);
      const dy = (Math.random()*70 - 35);
      spawnParticle(x + dx, y + dy);
    }

    openModal("Hi Annie 💙", "Just a tiny reminder: you’re loved. Like, a lot. ☁️💙");
  });
}

attachSfx();

// ===== First visit popup =====
try {
  const firstVisitKey = "annie_first_visit_v1";
  if (!localStorage.getItem(firstVisitKey)) {
    // small delay so it feels smooth after the page loads
    setTimeout(() => {
      openModal("Hi Annie 💙", "I made this little site for you because I miss you loads. Have a look around yeah 💙");
    }, 700);
    localStorage.setItem(firstVisitKey, "1");
  }
} catch {}

// ===== Our song button =====
const audio = document.getElementById("ourSong");
const songBtn = document.getElementById("songBtn");
const songStatus = document.getElementById("songStatus");

function setSongUI(playing){
  if (!songBtn || !songStatus) return;
  songBtn.textContent = playing ? "Pause ⏸️" : "Play 🎧";
  songStatus.textContent = playing ? "Now playing" : "Not playing";
}

if (audio && songBtn && songStatus) {
  setSongUI(false);

  songBtn.addEventListener("click", async () => {
    try {
      if (audio.paused) {
        await audio.play();
        setSongUI(true);
      } else {
        audio.pause();
        setSongUI(false);
      }
    } catch (e) {
      songStatus.textContent = "Tap again to play";
    }
  });

  audio.addEventListener("ended", () => setSongUI(false));
  audio.addEventListener("pause", () => setSongUI(false));
  audio.addEventListener("play", () => setSongUI(true));
}

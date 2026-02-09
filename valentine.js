/* ==========================
   Valentine Page Logic
   ========================== */

const introPanel   = document.getElementById("introPanel");
const askPanel     = document.getElementById("askPanel");
const whyPanel     = document.getElementById("whyPanel");
const successPanel = document.getElementById("successPanel");

const openEnvelope = document.getElementById("openEnvelope");
const introCard    = document.getElementById("introCard");

const askCard      = document.getElementById("askCard");
const choiceArea   = document.getElementById("choiceArea");
const yesBtn       = document.getElementById("yesBtn");
const noBtn        = document.getElementById("noBtn");

const typeLine     = document.getElementById("typeLine");
const subLine      = document.getElementById("subLine");
const pleaLine     = document.getElementById("pleaLine");
const meterFill    = document.getElementById("meterFill");

const whyText      = document.getElementById("whyText");
const sendWhy      = document.getElementById("sendWhy");
const fineYes      = document.getElementById("fineYes");
const whyResponse  = document.getElementById("whyResponse");

const giftBtn      = document.getElementById("giftBtn");
const letterBox    = document.getElementById("letterBox");
const letterBody   = document.getElementById("letterBody");

const floaties     = document.getElementById("floaties");
const soundBtn     = document.getElementById("soundBtn");

/* ---------- logging (Formspree) ---------- */
const LOGGING_ENABLED = true;
const FORMSPREE_ENDPOINT = "https://formspree.io/f/xbdalwer";

// Create a stable ID per browser (helps you group multiple events from one visit)
function getSessionId(){
  try{
    let id = localStorage.getItem("val_session");
    if (!id){
      id = (crypto?.randomUUID?.() || (String(Math.random()).slice(2) + "-" + Date.now()));
      localStorage.setItem("val_session", id);
    }
    return id;
  }catch(_){
    return "no-storage-" + Date.now();
  }
}

function getClientMeta(){
  const tz = (() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch(_) { return ""; }
  })();
  return {
    session: getSessionId(),
    tz,
    url: location.href,
    ref: document.referrer || "",
    ua: navigator.userAgent || "",
    screen: `${window.screen?.width || ""}x${window.screen?.height || ""}`,
    lang: navigator.language || ""
  };
}

// lightweight dedupe so touch/click doesn't double-submit
const _logLast = Object.create(null);

async function logEvent(event, extra = {}){
  if (!LOGGING_ENABLED) return;

  const now = Date.now();
  const key = event + ":" + JSON.stringify(extra);
  if (_logLast[key] && (now - _logLast[key] < 500)) return;
  _logLast[key] = now;

  const payload = {
    _subject: `Valentine page: ${event}`,
    event,
    ts: new Date().toISOString(),
    ...getClientMeta(),
    ...extra
  };

  try{
    await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload),
      // allow request to finish even if the tab navigates away
      keepalive: true
    });
  }catch(_){
    // fail silently so the page still works offline
  }
}

// log page view once
logEvent("page_loaded");
/* ---------- end logging ---------- */


/* ---------- sound (tiny WebAudio sfx) ---------- */
let soundOn = true;
let audioCtx = null;

function beep(type = "click"){
  if (!soundOn) return;
  try{
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();

    const presets = {
      hover: { freq: 720, dur: 0.05, shape:"sine" },
      click: { freq: 540, dur: 0.07, shape:"triangle" },
      yes:   { freq: 660, dur: 0.10, shape:"sine" },
      no:    { freq: 260, dur: 0.08, shape:"square" }
    };

    const p = presets[type] || presets.click;

    o.type = p.shape;
    o.frequency.setValueAtTime(p.freq, t);

    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.14, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + p.dur);

    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(t);
    o.stop(t + p.dur + 0.02);
  }catch(_){}
}

soundBtn?.addEventListener("click", () => {
  soundOn = !soundOn;
  soundBtn.textContent = soundOn ? "🔊" : "🔇";
  beep("click");
  logEvent("sound_toggled", { soundOn });
});

/* ---------- floaty hearts background ---------- */
function makeFloaties(){
  const icons = ["💙","💗","💌","✨","🫶","🎀"];
  for(let i=0;i<28;i++){
    const s = document.createElement("span");
    s.textContent = icons[Math.floor(Math.random()*icons.length)];
    s.style.left = `${Math.random()*100}%`;
    s.style.setProperty("--dur", `${10 + Math.random()*14}s`);
    s.style.setProperty("--drift", `${(-60 + Math.random()*120).toFixed(0)}px`);
    s.style.fontSize = `${14 + Math.random()*12}px`;
    s.style.animationDelay = `${Math.random()*12}s`;
    floaties.appendChild(s);
  }
}
makeFloaties();

/* ---------- 3D tilt effect on cards ---------- */
function addTilt(el){
  if(!el) return;
  const strength = 10;
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rx = (py - 0.5) * -strength;
    const ry = (px - 0.5) * strength;
    el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  });
  el.addEventListener("pointerleave", () => {
    el.style.transform = `perspective(900px) rotateX(0deg) rotateY(0deg)`;
  });
}
addTilt(introCard);
addTilt(askCard);
addTilt(document.getElementById("whyCard"));
addTilt(document.getElementById("successCard"));

/* ---------- little pop particles ---------- */
function pop(x, y, text="💙"){
  const p = document.createElement("div");
  p.className = "pop";
  p.textContent = text;
  p.style.left = `${x}px`;
  p.style.top  = `${y}px`;
  document.body.appendChild(p);
  setTimeout(() => p.remove(), 950);
}

/* ---------- typewriter ---------- */
function typeText(el, text, speed=35){
  return new Promise((resolve) => {
    el.textContent = "";
    let i = 0;
    const t = setInterval(() => {
      el.textContent += text[i++];
      if (i >= text.length){
        clearInterval(t);
        resolve();
      }
    }, speed);
  });
}

/* ---------- panel switching ---------- */
function show(panel){
  [introPanel, askPanel, whyPanel, successPanel].forEach(p => p.classList.remove("show"));
  panel.classList.add("show");

  [introPanel, askPanel, whyPanel, successPanel].forEach(p => p.setAttribute("aria-hidden", p !== panel));
}

/* ---------- intro envelope ---------- */
function openIntro(){
  beep("click");
  logEvent("envelope_opened");
  openEnvelope.classList.add("open");
  // tiny confetti pop on open (if lib loaded)
  setTimeout(() => {
    burstConfetti(0.35);
    show(askPanel);
    startQuestion();
  }, 520);
}

openEnvelope?.addEventListener("click", openIntro);
openEnvelope?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") openIntro();
});

/* ---------- question logic ---------- */
let noCount = 0;
let noMovedOnce = false;

const question = "Will you be my Valentine?";
const pleas = [
  "please 🥺 (1/5)",
  "pleaseeee 😭 (2/5)",
  "PLEASE 😩 (3/5)",
  "ok but… please?? 😔 (4/5)",
  "last one… please 💙 (5/5)"
];

function startQuestion(){
  typeText(typeLine, question, 30);
  pleaLine.textContent = "";
  meterFill.style.width = "0%";

  // make sure NO can move around inside its box
  // we only switch to absolute positioning after first move so it looks normal initially
  noBtn.style.position = "relative";
  noBtn.style.left = "0px";
  noBtn.style.top  = "0px";
  noBtn.style.transform = "none";
}

function randomPositionInside(container, el){
  const cr = container.getBoundingClientRect();
  const er = el.getBoundingClientRect();

  const pad = 8;
  const maxX = Math.max(pad, cr.width - er.width - pad);
  const maxY = Math.max(pad, cr.height - er.height - pad);

  const x = pad + Math.random() * maxX;
  const y = pad + Math.random() * maxY;

  return { x, y, cr };
}

function moveNoButton(){
  const { x, y, cr } = randomPositionInside(choiceArea, noBtn);

  if (!noMovedOnce){
    // switch to absolute only when it starts dodging
    noBtn.style.position = "absolute";
    noBtn.style.left = "50%";
    noBtn.style.top = "50%";
    noBtn.style.transform = "translate(-50%,-50%)";
    noMovedOnce = true;
  }

  // animate to new position (translate relative to center)
  const dx = x - cr.width/2;
  const dy = y - cr.height/2;
  noBtn.style.transition = "transform 120ms ease";
  noBtn.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${(-8 + Math.random()*16).toFixed(1)}deg)`;
}

function updateMeter(){
  const pct = Math.min(100, (noCount/5)*100);
  meterFill.style.width = `${pct}%`;
}

function noEscalationMessage(){
  if (noCount <= 5){
    pleaLine.textContent = pleas[noCount-1] || "";
  }
}

function goWhyPanel(){
  logEvent("why_panel_shown", { noCount });
  show(whyPanel);
  beep("click");
}

function goSuccess(source = "unknown"){
  logEvent("choice", { choice: "yes", source, noCount });
  show(successPanel);
  beep("yes");
  megaConfetti();

  // add some sweet pops
  const r = successPanel.getBoundingClientRect();
  for(let i=0;i<18;i++){
    setTimeout(() => pop(r.left + Math.random()*r.width, r.top + Math.random()*r.height, Math.random()>.5 ? "💙":"💗"), i*60);
  }
}

/* --- NO events: click/touch/hover --- */
function handleNo(e){
  // debounce so touchstart + click doesn’t double-trigger
  const _now = Date.now();
  if (handleNo._last && (_now - handleNo._last < 220)) return;
  handleNo._last = _now;

  e.preventDefault();
  noCount++;
  if (noCount === 1) logEvent("no_clicked_first_time");
  logEvent("no_clicked", { noCount });

  beep("no");
  updateMeter();
  noEscalationMessage();

  // pop where the pointer is
  const x = (e.touches?.[0]?.clientX ?? e.clientX ?? (window.innerWidth/2));
  const y = (e.touches?.[0]?.clientY ?? e.clientY ?? (window.innerHeight/2));
  pop(x, y, "😭");

  if (noCount < 6){
    moveNoButton();
    burstConfetti(0.12);
    subLine.textContent = "be honest… but like… not that honest 😭";
  }else{
    // after 5 "please"s -> awww how come?
    logEvent("choice", { choice: "no", source: "no_after_5", noCount });
    subLine.textContent = "ok… that hurt 💔";
    setTimeout(goWhyPanel, 250);
  }
}

noBtn.addEventListener("click", handleNo);
noBtn.addEventListener("touchstart", handleNo, { passive:false });
// also dodge on hover (desktop)
noBtn.addEventListener("mouseenter", (e) => {
  if (noCount >= 1 && noCount < 6){
    moveNoButton();
    beep("hover");
  }
});

/* --- YES events --- */
yesBtn.addEventListener("click", () => {
  goSuccess("main_yes");
});
yesBtn.addEventListener("mouseenter", () => beep("hover"));

/* --- WHY panel buttons --- */
fineYes.addEventListener("click", () => {
  goSuccess("fine_yes");
});

sendWhy.addEventListener("click", () => {
  beep("click");
  const msg = (whyText.value || "").trim();
  if (!msg){
    whyResponse.textContent = "type somethingggg 😭";
    return;
  }
  logEvent("why_submitted", { message: msg, noCount });
  whyResponse.textContent = "okay… i hear you 💙 (still love you loads)";
  burstConfetti(0.18);
});

/* --- Gift open -> letter reveal --- */
const letterText = `Annie,

I know its not always easy having me as your boyfriend,
but I'll always love you. I hope you like the gifts I have for you
this year, even if I am broke. I feel like I always buy you
keepsakes so I went a different route this time hehe.

I cant wait to spend time with you on our first holiday together,
and hopefully many more to come.

ps you are getting another handwritten letter also.

UR AMAZING MY BABY

Love,
Tom`;

function revealLetter(){
  logEvent("gift_opened");
  beep("yes");
  giftBtn.classList.add("open");
  letterBox.style.display = "block";
  letterBox.setAttribute("aria-hidden","false");
  typeText(letterBody, letterText, 18);
  heartConfetti();
}

giftBtn.addEventListener("click", revealLetter);
giftBtn.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") revealLetter();
});

/* ---------- confetti helpers ---------- */
function burstConfetti(intensity=0.2){
  if (typeof confetti !== "function") return;
  confetti({
    particleCount: Math.floor(90 * intensity),
    spread: 70,
    origin: { y: 0.75 }
  });
}

function megaConfetti(){
  if (typeof confetti !== "function") return;
  const duration = 1200;
  const end = Date.now() + duration;

  (function frame(){
    confetti({
      particleCount: 6,
      spread: 70,
      startVelocity: 45,
      ticks: 120,
      origin: { x: Math.random(), y: Math.random()*0.35 + 0.2 }
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

function heartConfetti(){
  if (typeof confetti !== "function") return;

  // simple heart-ish color palette
  const colors = ["#7fb8ff","#ffb6d6","#fff1b8","#ffffff"];

  confetti({
    particleCount: 120,
    spread: 90,
    startVelocity: 52,
    scalar: 1,
    origin: { y: 0.8 },
    colors
  });
}

/* ---------- start on load ---------- */
show(introPanel);
typeLine.textContent = "";


/* ---------- optional link logging ---------- */
document.addEventListener("click", (e) => {
  const a = e.target?.closest?.("a");
  if (!a) return;
  if (a.getAttribute("href") === "annie.html"){
    logEvent("back_to_main_site_clicked");
  }
});


// Count full days since Oct 4, 2024 (using UTC midnight to avoid timezone/DST weirdness)
const start = new Date(Date.UTC(2024, 9, 4)); // months are 0-based: 9 = October

function daysSince(dateUtcMidnight) {
  const now = new Date();
  const todayUtcMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const diffMs = todayUtcMidnight - dateUtcMidnight;
  return Math.max(0, Math.floor(diffMs / 86400000));
}

const el = document.getElementById("loveDays");
if (el) el.textContent = daysSince(start);

// Cute sparkles on tap (lightweight, no need for your big script)
const chars = ["✨","⭐","🫧","☁️","🎀","💙","💗","✦","✧"];
function particle(x, y){
  const p = document.createElement("div");
  p.className = "particle";
  p.textContent = chars[Math.floor(Math.random() * chars.length)];
  p.style.left = `${x}px`;
  p.style.top = `${y}px`;
  p.style.transform = `translate(-50%, -50%) rotate(${(Math.random()*24 - 12).toFixed(1)}deg)`;
  p.style.fontSize = `${14 + Math.floor(Math.random()*10)}px`;
  document.body.appendChild(p);
  setTimeout(() => p.remove(), 950);
}

window.addEventListener("pointerdown", (e) => {
  const tag = (e.target.tagName || "").toLowerCase();
  if (tag === "a" || tag === "button") return;

  const n = 3 + Math.floor(Math.random()*3);
  for(let i=0;i<n;i++){
    particle(e.clientX + (Math.random()*26 - 13), e.clientY + (Math.random()*26 - 13));
  }
}, { passive: true });

// Reveal animation (same idea as your main page, but simple)
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("show"); });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach(elm => io.observe(elm));

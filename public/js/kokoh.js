// Iron Legs page (/kokoh/ku10, /kokoh/ku14). Public: no sign-in, nothing is saved.
import { Player, drawFrame } from "./anim.js";
import { ANIMS } from "./drills.js";
import { VERSIONS, EX, SAFETY, GEAR, versionFor, allItems } from "./kokoh-program.js";

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const PLAY = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg>';
const TC = { ku10: "#F0783F", ku14: "#78A2F2" };

// /kokoh/ku10 on the live site; kokoh.html?v=ku10 when served without rewrites.
const local = /\.html$/.test(location.pathname);
const hrefFor = (key) => (local ? "?v=" + key : "/kokoh/" + key);
function pickVersion() {
  const m = /\/kokoh\/(ku1[04])\b/i.exec(location.pathname);
  const q = new URLSearchParams(location.search).get("v");
  return versionFor((m && m[1]) || q || (location.hash || "").replace("#", ""));
}

const V = pickVersion();
if (V) document.documentElement.setAttribute("data-group", V.group);

/* ---------------- page ---------------- */
function switchHtml() {
  return Object.values(VERSIONS).map((v) => '<a href="' + hrefFor(v.id) + '"' + (V && V.id === v.id ? ' aria-current="page"' : '') + '>' + v.label + '</a>').join("");
}

function chooserHtml() {
  return '<section class="kk-hero"><p class="kk-eyebrow">Program tambahan · 67 Days Streak Court</p><h1 class="kk-title">IRON <span>LEGS</span></h1>' +
    '<p class="kk-lead">Latihan kekuatan dan stabilitas supaya tidak mudah goyah saat sprint, berhenti mendadak, ganti arah, atau kena body contact. Pilih versimu:</p></section>' +
    '<div class="kk-pick">' + Object.values(VERSIONS).map((v) => '<a class="kk-pickcard" data-v="' + v.id + '" href="' + hrefFor(v.id) + '"><b>' + v.label + '</b><span>' + esc(v.ages) + ' · ±' + v.minutes + ' menit</span></a>').join("") + '</div>';
}

function cardHtml(it, bi, ii) {
  const e = EX[it.ex];
  return '<article class="kk-card">' +
    '<div class="kk-stage"><canvas data-anim="' + e.anim + '" role="img" aria-label="Animasi: ' + esc(e.name) + '"></canvas>' +
    '<button type="button" class="kk-vbtn" data-video="' + it.ex + '">' + PLAY + 'Video</button></div>' +
    '<div class="kk-body"><h3 class="kk-name"><span class="kk-idx">' + (bi + 1) + '.' + (ii + 1) + '</span> ' + esc(e.name) + '</h3>' +
    '<div class="kk-dose">' + esc(it.dose) + (it.rest ? '<small> · istirahat ' + (it.restText || it.rest + ' dtk') + '</small>' : '') + '</div>' +
    '<ul class="kk-cues">' + e.cues.map((c) => '<li>' + esc(c) + '</li>').join("") + (it.note ? '<li>' + esc(it.note) + '</li>' : '') + '</ul>' +
    (it.level ? '<p class="kk-level"><b>Naik level:</b> ' + esc(it.level) + '</p>' : '') +
    '</div></article>';
}

function pageHtml(v) {
  const items = allItems(v).length;
  let h = '<section class="kk-hero"><p class="kk-eyebrow">Program tambahan · 67 Days Streak Court</p>' +
    '<h1 class="kk-title">IRON <span>LEGS</span></h1>' +
    '<p class="kk-meta"><b>Versi ' + v.label + '</b> · ' + esc(v.ages) + ' · ±' + v.minutes + ' menit · 2–3x seminggu</p>' +
    '<p class="kk-lead">Supaya tidak mudah goyah saat sprint, berhenti mendadak, ganti arah, atau kena body contact. ' + esc(v.focus) + '</p>' +
    '<div class="kk-actions"><button type="button" class="btn big" id="kk-start">' + PLAY + 'Mulai latihan</button>' +
    '<a class="btn ghost" href="#cara">Cara pakai</a></div></section>';

  h += '<section class="card kk-how" id="cara"><h3>Cara pakai</h3><ul>' +
    '<li><b>2–3x seminggu</b>, selang sehari (contoh: Senin · Rabu · Jumat).</li>' +
    '<li>Kerjakan <b>berurutan</b>: lompat dan sprint dikerjakan saat kaki masih segar, baru kekuatan dan core.</li>' +
    '<li>Tekan <b>Mulai latihan</b>: tiap gerakan muncul dengan animasi, jumlah set, dan timer istirahat. Tekan <b>Video</b> untuk contoh asli.</li>' +
    '<li>Yang dilatih: glute, paha belakang, paha depan, betis & ankle, core, dan stabilitas pinggul.</li></ul>' +
    '<p class="kk-gearh">Alat</p><div class="kk-gear">' + GEAR[v.id].map((g) => '<span class="chip">' + esc(g) + '</span>').join("") + '</div></section>';

  v.blocks.forEach((b, bi) => {
    h += '<section class="kk-block" aria-labelledby="blk-' + b.id + '"><div class="kk-bh"><span class="kk-num">' + (bi + 1) + '</span><div><h2 id="blk-' + b.id + '">' + esc(b.name) + ' <small>±' + b.min + ' menit</small></h2><p>' + esc(b.why) + '</p></div></div>' +
      '<div class="kk-grid">' + b.items.map((it, ii) => cardHtml(it, bi, ii)).join("") + '</div>' +
      (b.tip ? '<p class="note kk-tip">' + esc(b.tip) + '</p>' : '') + '</section>';
  });

  h += '<section class="card kk-safe"><h3>Aturan aman</h3><ul>' + SAFETY.map((s) => '<li>' + esc(s) + '</li>').join("") + '</ul></section>';
  h += '<div class="kk-bottom"><button type="button" class="btn big" id="kk-start2">' + PLAY + 'Mulai latihan · ' + items + ' gerakan</button></div>';
  return h;
}

function footHtml() {
  return '<p>Bagian dari <a href="/">67 Days Streak Court</a>. Halaman ini bisa dibuka tanpa login dan tidak menyimpan data apa pun.</p>' +
    '<p>Disusun mengikuti NSCA Youth Resistance Training position statement, NBA & USA Basketball Youth Guidelines, dan latihan pencegahan cedera FIFA 11+ (Nordic, pendaratan). Video demo dari kanal pelatih dan fisioterapis di YouTube.</p>';
}

/* ---------------- card animations (only while visible) ---------------- */
const players = new Map();
let io = null;
function wireCanvases() {
  const cvs = document.querySelectorAll("canvas[data-anim]");
  // a still frame first, so no card is ever blank; visible cards then animate
  cvs.forEach((c) => { const spec = ANIMS[c.dataset.anim]; if (spec) try { drawFrame(c, spec, spec.dur * 0.4); } catch (e) { console.error(e); } });
  if (!("IntersectionObserver" in window)) {
    cvs.forEach((c) => startCanvas(c));
    return;
  }
  io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) startCanvas(en.target); else stopCanvas(en.target); });
  }, { rootMargin: "120px 0px" });
  cvs.forEach((c) => io.observe(c));
}
function startCanvas(c) {
  const spec = ANIMS[c.dataset.anim];
  if (!spec || players.has(c)) return;
  const p = new Player(c); p.play(spec); players.set(c, p);
}
function stopCanvas(c) { const p = players.get(c); if (p) { p.stop(); players.delete(c); } }
function pauseAllCards(on) { players.forEach((p) => (on ? p.pause() : p.resume())); }

/* ---------------- video modal ---------------- */
let lastFocus = null;
function openModal(title, body) {
  lastFocus = document.activeElement;
  $("m-title").textContent = title;
  $("m-body").innerHTML = body;
  $("modal").hidden = false;
  $("m-close").focus();
}
function closeModal() {
  $("modal").hidden = true;
  $("m-body").innerHTML = "";
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}
function openVideo(exId) {
  const e = EX[exId]; if (!e) return;
  const v = e.video;
  const src = "https://www.youtube-nocookie.com/embed/" + v.id + "?autoplay=1&rel=0&playsinline=1" + (v.start ? "&start=" + v.start : "");
  const watch = "https://www.youtube.com/watch?v=" + v.id + (v.start ? "&t=" + v.start + "s" : "");
  const search = "https://www.youtube.com/results?search_query=" + encodeURIComponent(e.name + " exercise how to");
  if (G.open && G.phase === "work" && G.running) togglePause();
  openModal(e.name, '<div class="vid"><iframe src="' + src + '" title="Video demo: ' + esc(e.name) + '" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>' +
    '<p class="small">Video: ' + esc(v.by) + '. Fokus pada gerakannya; jumlah set dan repetisi ikuti program ini.</p>' +
    '<div class="row"><a class="btn ghost" href="' + watch + '" target="_blank" rel="noopener">Buka di YouTube</a><a class="btn ghost" href="' + search + '" target="_blank" rel="noopener">Cari video lain</a></div>');
}

/* ---------------- guided session ---------------- */
const G = { open: false, items: [], i: 0, set: 1, side: 0, phase: "ready", left: 0, running: false, tick: 0, player: null, wake: null };
let audio = null;
function beep(freq, ms) {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const o = audio.createOscillator(), g = audio.createGain();
    o.frequency.value = freq; o.connect(g); g.connect(audio.destination);
    g.gain.setValueAtTime(0.18, audio.currentTime); g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + ms / 1000);
    o.start(); o.stop(audio.currentTime + ms / 1000);
  } catch (e) { /* no sound */ }
}
const sides = (it) => (it.kind === "time" && it.side ? 2 : 1);
const fmt = (s) => Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");

function openGuided() {
  G.items = allItems(V); G.i = 0; G.open = true;
  $("g").style.setProperty("--tc", TC[V.id]);
  $("g").hidden = false; $("g-finish").hidden = true; $("g-run").hidden = false; $("g-ctrl").hidden = false; $("g-stage").hidden = false;
  document.body.style.overflow = "hidden";
  pauseAllCards(true);
  G.player = G.player || new Player($("g-canvas"));
  enterItem(0);
  keepAwake();
  $("g-main").focus();
}
function keepAwake() {
  try {
    if (navigator.wakeLock && !G.wake) navigator.wakeLock.request("screen").then((w) => { G.wake = w; w.addEventListener("release", () => { G.wake = null; }); }).catch(() => {});
  } catch (e) { /* not supported */ }
}
function closeGuided() {
  stopTick(); G.open = false;
  if (G.player) G.player.stop();
  $("g").hidden = true; document.body.style.overflow = "";
  pauseAllCards(false);
  if (G.wake) { G.wake.release().catch(() => {}); G.wake = null; }
}
function enterItem(i) {
  stopTick();
  G.i = Math.max(0, Math.min(G.items.length - 1, i));
  G.set = 1; G.side = 0; G.running = false;
  const it = G.items[G.i];
  G.phase = it.kind === "time" ? "ready" : "work";
  G.left = it.kind === "time" ? it.secs : 0;
  const spec = ANIMS[EX[it.ex].anim];
  if (spec) G.player.play(spec);
  draw();
}
function startTick() {
  stopTick(); G.running = true;
  G.tick = setInterval(() => {
    G.left -= 1;
    if (G.left > 0 && G.left <= 3) beep(660, 120);
    if (G.left <= 0) { beep(G.phase === "rest" ? 990 : 880, 260); stepDone(); return; }
    draw();
  }, 1000);
  draw();
}
function stopTick() { clearInterval(G.tick); G.tick = 0; G.running = false; }
function togglePause() { if (G.running) { stopTick(); draw(); } else startTick(); }

// A work interval (or a set of reps) is finished, or a rest ran out.
function stepDone() {
  const it = G.items[G.i];
  stopTick();
  if (G.phase === "rest") {
    G.phase = "work";
    if (it.kind === "time") { G.left = it.secs; startTick(); return; }
    draw(); return;
  }
  if (it.kind === "time" && G.side < sides(it) - 1) { G.side += 1; G.left = it.secs; G.phase = "work"; startTick(); return; }
  if (it.kind !== "free" && G.set < it.sets) {
    G.set += 1; G.side = 0;
    G.phase = "rest"; G.left = it.rest || 30; startTick(); return;
  }
  if (G.i >= G.items.length - 1) { finish(); return; }
  enterItem(G.i + 1);
}

function draw() {
  const it = G.items[G.i], e = EX[it.ex];
  $("g-block").textContent = it.block.name;
  $("g-count").textContent = (G.i + 1) + " / " + G.items.length;
  $("g-prog").style.width = Math.round(G.i / G.items.length * 100) + "%";
  const rest = G.phase === "rest";
  $("g-kind").textContent = rest ? "Istirahat" : "Latihan";
  $("g-kind").classList.toggle("rest", rest);
  $("g-name").textContent = e.name;
  let set = "";
  if (it.kind === "free") set = it.dose;
  else if (rest) set = "Berikutnya: set " + G.set + " dari " + it.sets;
  else if (it.kind === "time") set = "Set " + G.set + " dari " + it.sets + (sides(it) > 1 ? " · " + (G.side === 0 ? "kiri" : "kanan") : "");
  else set = "Set " + G.set + " dari " + it.sets + (it.side ? " · " + it.side : "");
  $("g-set").textContent = set;
  const clock = $("g-clock");
  clock.classList.toggle("hot", G.phase === "work" && G.running && G.left <= 3);
  if (it.kind === "time" || rest) clock.textContent = fmt(Math.max(0, G.left));
  else if (it.kind === "reps") clock.textContent = "× " + it.reps;
  else clock.textContent = "✓";
  $("g-cue").textContent = rest ? (it.restText ? "Jalan balik ke start. Tarik napas." : "Tarik napas, minum sedikit.") : e.cues.join(" ") + (it.note ? " " + it.note : "") + (it.level && G.set === 1 ? " Naik level: " + it.level : "");
  const main = $("g-main");
  if (rest) main.textContent = "Lanjut";
  else if (it.kind === "time") main.textContent = G.running ? "Jeda" : (G.phase === "ready" ? "Mulai" : "Lanjut");
  else if (it.kind === "reps") main.textContent = G.set < it.sets ? "Set selesai" : "Selesai";
  else main.textContent = "Selesai";
  $("g-back").disabled = G.i === 0;
  const nx = G.items[G.i + 1];
  $("g-next").innerHTML = nx ? 'Berikutnya: <b>' + esc(EX[nx.ex].name) + '</b> · ' + esc(nx.dose) : 'Gerakan terakhir. Ayo!';
}
function onMain() {
  const it = G.items[G.i];
  if (G.phase === "rest") { stepDone(); return; }
  if (it.kind === "time") { if (G.phase === "ready") G.phase = "work"; togglePause(); return; }
  stepDone();
}
function finish() {
  stopTick();
  $("g-prog").style.width = "100%";
  $("g-run").hidden = true; $("g-ctrl").hidden = true; $("g-stage").hidden = true; $("g-next").innerHTML = "";
  if (G.player) G.player.stop();
  beep(880, 160); setTimeout(() => beep(1320, 300), 180);
  const f = $("g-finish"); f.hidden = false;
  f.innerHTML = '<h2>LATIHAN SELESAI</h2><p>Kerja bagus. Besok istirahat atau main basket saja, latihan Iron Legs lagi lusa. Jangan lupa makan dan tidur cukup.</p><div class="row"><button type="button" class="big" id="g-done">Tutup</button></div>';
  $("g-done").addEventListener("click", closeGuided);
  $("g-done").focus();
}

/* ---------------- boot ---------------- */
$("kk-switch").innerHTML = switchHtml();
$("kk-foot").innerHTML = footHtml();
if (!V) {
  $("kk-main").innerHTML = chooserHtml();
  document.title = "Iron Legs · 67 Days Streak Court";
} else {
  document.title = "Iron Legs " + V.label + " · 67 Days Streak Court";
  $("kk-main").innerHTML = pageHtml(V);
  wireCanvases();
  $("kk-start").addEventListener("click", openGuided);
  $("kk-start2").addEventListener("click", openGuided);
  $("kk-main").addEventListener("click", (ev) => { const b = ev.target.closest("[data-video]"); if (b) openVideo(b.dataset.video); });
  $("g-video").addEventListener("click", () => openVideo(G.items[G.i].ex));
  $("g-close").addEventListener("click", closeGuided);
  $("g-main").addEventListener("click", onMain);
  $("g-back").addEventListener("click", () => enterItem(G.i - 1));
  $("g-skip").addEventListener("click", () => { if (G.i >= G.items.length - 1) finish(); else enterItem(G.i + 1); });
}
$("m-close").addEventListener("click", closeModal);
$("modal").addEventListener("click", (ev) => { if (ev.target === $("modal")) closeModal(); });
document.addEventListener("keydown", (ev) => {
  if (ev.key !== "Escape") return;
  if (!$("modal").hidden) closeModal();
  else if (G.open) closeGuided();
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && G.open) keepAwake();
});

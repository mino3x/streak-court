import { CHALLENGES, TESTS, HANDLES, PROGRAM, WEEKDAYS, DAY_LONG, DAY_SHORT, BADGES } from "./program.js";
import { animFor } from "./drills.js";
import { Player } from "./anim.js";
import { videoFor, embedUrl, watchUrl } from "./videos.js";
import * as store from "./store.js";

const $ = (id) => document.getElementById(id);

/* ---------------- Blocks & segments ---------------- */
function blocksFor(p, day, mode) {
  const P = PROGRAM[p], D = P.days[day];
  const warm = { id: "warmup", kind: "Injury-proof warm-up", title: "Warm-up", items: P.warmup };
  const ath = { id: "athletic", kind: "Athletic", title: D.athletic.title, items: D.athletic.items, test: !!D.athletic.test };
  const han = { id: "handles", kind: "Handles", title: "Handles circuit", items: HANDLES };
  const ski = { id: "skill", kind: "Basketball", title: D.skill.title, items: D.skill.items, ch: D.skill.ch };
  const str = { id: "strength", kind: "Strength & core", title: D.strength.title, items: D.strength.items };
  if (mode === "lite") {
    const chItem = D.skill.items.filter((it) => it.t === "challenge");
    return [warm, han, { id: "challenge", kind: "Basketball", title: CHALLENGES[D.skill.ch].label, items: chItem, ch: D.skill.ch }];
  }
  return [warm, ath, han, ski, str];
}
function expand(items) {
  const segs = [];
  items.forEach((it) => {
    for (let k = 1; k <= it.x; k++) {
      (it.L ? ["Left", "Right"] : [null]).forEach((side) => {
        segs.push({ kind: it.t === "rest" ? "rest" : (it.t || "work"), name: it.n + (side ? " · " + side : ""), secs: it.s, cue: it.c,
          set: it.x > 1 ? "Set " + k + " of " + it.x : "", dirs: it.dirs, ch: it.ch, test: it.test });
      });
      if (it.r > 0) segs.push({ kind: "rest", name: "Rest", secs: it.r, cue: "Breathe. Get ready for the next one.", set: "" });
    }
  });
  while (segs.length && segs[segs.length - 1].kind === "rest" && segs[segs.length - 1].name === "Rest") segs.pop();
  return segs;
}
const blockSecs = (b) => expand(b.items).reduce((a, s) => a + s.secs, 0);
const fmtMin = (secs) => Math.round(secs / 60) + " min";
const fmtClock = (ms) => { const s = Math.ceil(ms / 1000); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
function itemTime(it) {
  if (it.L) return (it.x > 1 ? it.x + " × " : "") + it.s + " s each side";
  if (it.x > 1) return it.x + " × " + it.s + " s";
  return (it.s >= 60 && it.s % 60 === 0) ? (it.s / 60) + " min" : it.s + " s";
}

/* ---------------- Dates ---------------- */
const pad = (n) => String(n).padStart(2, "0");
const keyOf = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const parseKey = (k) => { const a = k.split("-"); return new Date(+a[0], +a[1] - 1, +a[2]); };
const addDays = (d, n) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; };
const dow = (d) => ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][d.getDay()];
const isWeekday = (d) => d.getDay() !== 0 && d.getDay() !== 6;
const today = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };

function lsGet(k, fb) { try { const v = localStorage.getItem(k); return v === null ? fb : JSON.parse(v); } catch (e) { return fb; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }

const state = { player: lsGet("sc.player", "harvell"), tab: "today", viewDay: null, modePref: "full", sound: lsGet("sc.sound", true), user: null, status: "connecting" };
if (!PROGRAM[state.player]) state.player = "harvell";

/* ---------------- Logs ---------------- */
let logs = {};
const logId = (p, date) => p + "_" + date;
const logsOf = (p) => Object.values(logs).filter((l) => l && l.player === p);
const getLog = (p, date) => logs[logId(p, date)] || null;
const requiredBlocks = (mode) => mode === "lite" ? ["warmup", "handles", "challenge"] : ["warmup", "athletic", "handles", "skill", "strength"];
function isComplete(l) {
  const b = l.blocks || {};
  return requiredBlocks(l.mode).every((id) => id === "challenge" ? !!(b.challenge || b.skill) : !!b[id]);
}
function updateLog(p, date, fn) {
  const cur = getLog(p, date);
  const l = cur ? JSON.parse(JSON.stringify(cur)) : { player: p, date, mode: state.modePref, blocks: {}, score: null, tests: {}, complete: false };
  fn(l);
  l.complete = isComplete(l);
  const wasComplete = cur ? !!cur.complete : false;
  logs[logId(p, date)] = l;
  render();
  store.saveLog(l).catch((e) => { console.error(e); toast("Couldn't save. Check your connection and try again."); });
  if (l.complete && !wasComplete) celebrateDay(p);
  return l;
}

/* ---------------- Streaks & bests ---------------- */
function doneSet(p) { const s = {}; logsOf(p).forEach((l) => { if (l.complete) s[l.date] = true; }); return s; }
function currentStreak(p) {
  const done = doneSet(p), tk = keyOf(today());
  let d = today(), n = 0;
  for (let g = 0; g < 4000; g++) {
    if (isWeekday(d)) { const k = keyOf(d); if (done[k]) n++; else if (k !== tk) break; }
    d = addDays(d, -1);
  }
  return n;
}
function nextWeekdayKey(k) { let d = addDays(parseKey(k), 1); while (!isWeekday(d)) d = addDays(d, 1); return keyOf(d); }
function longestStreak(p) {
  const keys = Object.keys(doneSet(p)).filter((k) => isWeekday(parseKey(k))).sort();
  let best = 0, run = 0, prev = null;
  keys.forEach((k) => { run = (prev && nextWeekdayKey(prev) === k) ? run + 1 : 1; best = Math.max(best, run); prev = k; });
  return best;
}
const totalDays = (p) => logsOf(p).filter((l) => l.complete).length;
function history(p, metric) {
  return logsOf(p).map((l) => {
    let v = null;
    if (metric.type === "ch" && l.score && l.score.id === metric.id) v = l.score.value;
    if (metric.type === "test" && l.tests && typeof l.tests[metric.id] === "number") v = l.tests[metric.id];
    return v === null || v === undefined ? null : { date: l.date, v: Number(v) };
  }).filter(Boolean).sort((a, b) => a.date < b.date ? -1 : 1);
}
function best(p, metric, excludeDate) {
  const h = history(p, metric).filter((x) => x.date !== excludeDate);
  return h.length ? Math.max(...h.map((x) => x.v)) : null;
}
function challengesFor(p) { const seen = []; WEEKDAYS.forEach((d) => { const c = PROGRAM[p].days[d].skill.ch; if (!seen.includes(c)) seen.push(c); }); return seen; }

/* ---------------- Icons ---------------- */
const ICON = {
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  play: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg>',
  flame: '<svg viewBox="0 0 34 42" aria-hidden="true"><path d="M17 2c2 8 12 12 12 24a12 12 0 0 1-24 0c0-6 3-10 6-13 0 5 2 8 5 9-2-7 0-14 1-20z" style="fill:var(--accent)"/><path d="M17 22c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 4 3 4-1-3-1-6 0-9z" style="fill:var(--bg)"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>',
  badge: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="20" r="15" fill="none" stroke="currentColor" stroke-width="3"/><path d="M9 20h30M24 5v30M14 9c4 4 4 18 0 22M34 9c-4 4-4 18 0 22" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 33l-3 12 11-5 11 5-3-12" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>'
};
function arrowSvg(dir) {
  const rot = dir === "left" ? 180 : dir === "up" ? -90 : 0;
  return '<svg viewBox="0 0 100 100" aria-label="' + dir + '" role="img"><g transform="rotate(' + rot + ' 50 50)"><path d="M12 50h62M52 24l26 26-26 26" fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/></g></svg>';
}
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------------- Render ---------------- */
function render() {
  document.documentElement.setAttribute("data-player", state.player);
  document.querySelectorAll(".player-btn").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.p === state.player)));
  document.querySelectorAll(".tab").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === state.tab)));
  const sb = $("soundBtn"); sb.textContent = state.sound ? "Sound on" : "Sound off"; sb.setAttribute("aria-pressed", String(state.sound));
  renderHero();
  const panel = $("panel");
  panel.setAttribute("aria-labelledby", "tab-" + state.tab);
  panel.innerHTML = state.tab === "today" ? viewToday() : state.tab === "week" ? viewWeek() : state.tab === "progress" ? viewProgress() : viewGuide();
}

function renderHero() {
  const p = state.player, cur = currentStreak(p), lon = longestStreak(p);
  const t = today(), monday = addDays(t, -((t.getDay() + 6) % 7)), done = doneSet(p);
  const dots = WEEKDAYS.map((d, i) => {
    const dd = addDays(monday, i), k = keyOf(dd);
    let cls = "dot", inner = DAY_SHORT[d].charAt(0);
    if (done[k]) { cls += " done"; inner = ICON.check; }
    else if (k === keyOf(t)) cls += " today";
    else if (dd < t) { cls += " miss"; inner = ICON.x; }
    return '<div class="wd"><div class="' + cls + '" aria-label="' + DAY_LONG[d] + (done[k] ? " done" : "") + '">' + inner + '</div><span>' + DAY_SHORT[d].toUpperCase() + '</span></div>';
  }).join("");
  const nb = BADGES.find((b) => b.n > cur);
  const nbHtml = nb
    ? '<div class="nextbadge"><div class="nb-row"><span>Next badge: <b>' + nb.label + '</b></span><span>' + cur + ' / ' + nb.n + '</span></div><div class="bar"><i style="width:' + Math.min(100, Math.round(cur / nb.n * 100)) + '%"></i></div></div>'
    : '<div class="nextbadge"><div class="nb-row"><b>Every badge unlocked.</b></div></div>';
  const todayDone = done[keyOf(t)];
  const sub = !isWeekday(t) ? "Weekend rest. The streak waits for Monday." : todayDone ? "Today is done. See you tomorrow." : cur > 0 ? "Train today to keep it alive." : "Finish today's session to start one.";
  $("hero").innerHTML =
    '<div class="streak"><div class="streak-num">' + ICON.flame + '<b>' + cur + '</b></div><div><div class="streak-lbl">Day streak</div><div class="streak-sub">Best: ' + lon + ' · Total: ' + totalDays(p) + '</div></div></div>' +
    '<div class="hero-right"><div class="week" aria-label="This week">' + dots + '</div>' + nbHtml + '<div class="streak-sub">' + sub + '</div></div>';
}

const currentDayKey = () => isWeekday(today()) ? dow(today()) : null;
const currentMode = () => { const l = getLog(state.player, keyOf(today())); return l ? l.mode : state.modePref; };

function viewToday() {
  const p = state.player, P = PROGRAM[p], tk = keyOf(today()), td = currentDayKey();
  const day = state.viewDay || td || "mon";
  const isToday = day === td;
  const log = isToday ? getLog(p, tk) : null;
  const mode = log ? log.mode : state.modePref;
  const blocks = blocksFor(p, day, mode);
  const b = (log && log.blocks) || {};
  const total = blocks.reduce((a, bl) => a + blockSecs(bl), 0);
  const chips = WEEKDAYS.map((d) => '<button type="button" class="daychip" data-day="' + d + '" aria-pressed="' + (d === day) + '">' + DAY_SHORT[d] + (d === td ? '<span class="t">TODAY</span>' : '') + '</button>').join("");
  let html = '<div class="dayhead"><div class="daychips" role="group" aria-label="Day">' + chips + '</div>';
  html += '<div class="daytitle"><h2>' + DAY_LONG[day] + ' · ' + esc(P.days[day].athletic.title) + '</h2><span class="chip">' + fmtMin(total) + ' total</span></div>';
  if (!td) html += '<div class="note">It\'s the weekend: rest days. Play another sport or just play. Showing ' + DAY_LONG[day] + '\'s plan as a preview.</div>';
  else if (!isToday) html += '<div class="note">Preview of ' + DAY_LONG[day] + '. Only today\'s session counts toward the streak.</div>';
  html += '</div>';
  const full = blocksFor(p, day, "full").reduce((a, x) => a + blockSecs(x), 0), lite = blocksFor(p, day, "lite").reduce((a, x) => a + blockSecs(x), 0);
  html += '<div class="mode" role="group" aria-label="Session length">' +
    '<button type="button" data-mode="full" aria-pressed="' + (mode === "full") + '"' + (isToday ? '' : ' disabled') + '><b>Full session</b><small>' + fmtMin(full) + '</small></button>' +
    '<button type="button" data-mode="lite" aria-pressed="' + (mode === "lite") + '"' + (isToday ? '' : ' disabled') + '><b>Team practice day</b><small>' + fmtMin(lite) + ' · still counts</small></button></div>';
  if (log && log.complete) {
    const cs = currentStreak(p);
    html += '<div class="done-banner">' + ICON.check + '<div><b>Day complete</b><span>Streak: ' + cs + ' day' + (cs === 1 ? '' : 's') + '. Rest well tonight (' + P.sleep + ' of sleep).</span></div></div>';
  }
  html += '<div class="blocks">';
  blocks.forEach((bl) => {
    const isDone = !!b[bl.id] || (bl.id === "challenge" && !!b.skill);
    const items = bl.items.map((it, idx) => {
      const canPrev = it.t !== "rest" && !!animFor(it.L ? it.n + " · Left" : it.n);
      return '<li class="' + (it.t === "challenge" ? "ch" : "") + '"><span class="in">' + esc(it.n) + '</span><span class="it">' + itemTime(it) + (it.r ? ' · rest ' + it.r + ' s' : '') + '</span>' +
        (canPrev ? '<button type="button" class="pv prev" data-preview="' + bl.id + ':' + idx + '" aria-label="Show how to do ' + esc(it.n) + '">' + ICON.play + '</button>' : '<span></span>') +
        '<span class="ic">' + esc(it.c) + '</span></li>';
    }).join("");
    html += '<article class="block' + (isDone ? ' is-done' : '') + '"><div class="bmain">' +
      '<button type="button" class="check" data-toggle="' + bl.id + '" aria-label="Mark ' + esc(bl.title) + (isDone ? ' not done' : ' done') + '"' + (isToday ? '' : ' disabled') + '>' + ICON.check + '</button>' +
      '<div class="binfo"><div class="bk">' + esc(bl.kind) + '</div><div class="bt">' + esc(bl.title) + '</div><div class="bm">' + fmtMin(blockSecs(bl)) + ' · ' + bl.items.length + ' drills' + (bl.ch ? ' · challenge: ' + esc(CHALLENGES[bl.ch].label) : '') + '</div></div>' +
      '<button type="button" class="start" data-start="' + bl.id + '">' + ICON.play + (isDone ? 'Again' : 'Start') + '</button>' +
      '</div><details><summary>Drills</summary><ul class="items">' + items + '</ul></details></article>';
  });
  html += '</div>';
  const chId = P.days[day].skill.ch, C = CHALLENGES[chId];
  if (isToday) {
    const curScore = log && log.score && log.score.id === chId ? log.score.value : "";
    const pb = best(p, { type: "ch", id: chId }, tk);
    html += '<section class="card" aria-labelledby="ch-h"><h3 id="ch-h">Today\'s challenge · ' + esc(C.label) + '</h3><p>' + esc(C.how) + '</p><div class="scorerow">' +
      stepperHtml("score-today", curScore, C.max) + ' <span class="unit">' + esc(C.unit) + '</span> <button type="button" class="save" data-savescore="' + chId + '">Save score</button></div>' +
      '<div class="pbline">Personal best: <b>' + (pb === null ? '—' : pb + ' ' + esc(C.unit)) + '</b>' + (curScore !== "" ? ' · Today: <b>' + curScore + '</b>' : '') + '</div></section>';
    if (P.days[day].athletic.test && mode === "full") html += testsCard(p, tk, log);
  } else {
    html += '<section class="card"><h3>' + DAY_LONG[day] + '\'s challenge · ' + esc(C.label) + '</h3><p>' + esc(C.how) + '</p></section>';
  }
  return html;
}
function stepperHtml(id, val, max) {
  return '<span class="stepper"><button type="button" data-step="-1" data-for="' + id + '" aria-label="Minus one">−</button><input id="' + id + '" type="number" inputmode="numeric" min="0" max="' + max + '" value="' + (val === "" || val === null || val === undefined ? "" : val) + '" placeholder="0" aria-label="Score"><button type="button" data-step="1" data-for="' + id + '" aria-label="Plus one">+</button></span>';
}
function testsCard(p, tk, log) {
  const vals = (log && log.tests) || {};
  const fields = TESTS[p].map((t) => {
    const pb = best(p, { type: "test", id: t.id }, tk);
    return '<div class="test"><label for="test-' + t.id + '">' + esc(t.label) + '</label>' + stepperHtml("test-" + t.id, typeof vals[t.id] === "number" ? vals[t.id] : "", t.max) + ' <span class="unit">' + esc(t.unit) + '</span><div class="pbline">' + esc(t.how) + ' Best: <b>' + (pb === null ? '—' : pb) + '</b></div></div>';
  }).join("");
  return '<section class="card" aria-labelledby="tests-h"><h3 id="tests-h">Friday tests</h3><p>Test yourself every Friday. Beat last week\'s numbers.</p><div class="tests">' + fields + '</div><div style="margin-top:12px"><button type="button" class="save" data-savetests="1">Save tests</button></div></section>';
}
function viewWeek() {
  const p = state.player, P = PROGRAM[p];
  const rows = WEEKDAYS.map((d) => {
    const D = P.days[d];
    return '<div class="wp"><div class="d">' + DAY_SHORT[d].toUpperCase() + '<small>' + fmtMin(blocksFor(p, d, "full").reduce((a, x) => a + blockSecs(x), 0)) + '</small></div><dl>' +
      '<dt>Warm-up</dt><dd>Injury-proof warm-up · 5 min</dd>' +
      '<dt>Athletic</dt><dd>' + esc(D.athletic.title) + ' · ' + fmtMin(blockSecs({ items: D.athletic.items })) + '</dd>' +
      '<dt>Handles</dt><dd>Warm-up + 5-min circuit · 7 min</dd>' +
      '<dt>Basketball</dt><dd>' + esc(D.skill.title) + ' · 10 min · <b>' + esc(CHALLENGES[D.skill.ch].label) + '</b></dd>' +
      '<dt>Strength</dt><dd>' + esc(D.strength.title) + ' · ' + fmtMin(blockSecs({ items: D.strength.items })) + '</dd></dl></div>';
  }).join("");
  return '<div class="weekplan"><div class="note">' + P.name + ' (' + P.group + '). Physical work each day: warm-up 5 + athletic 8 + strength 7 = 20 min. Basketball: handles 7 + skill 10. Saturday and Sunday are rest days.</div>' + rows +
    '<div class="wp"><div class="d">SAT<small>Rest</small></div><dl><dt>Plan</dt><dd>Rest, family time, or another sport.</dd></dl></div>' +
    '<div class="wp"><div class="d">SUN<small>Rest</small></div><dl><dt>Plan</dt><dd>Rest. Sleep ' + P.sleep + ' a night.</dd></dl></div></div>';
}
function spark(h) {
  if (h.length < 2) return '<span class="unit">' + (h.length ? '1 entry' : 'No entries') + '</span>';
  const pts = h.slice(-10), vs = pts.map((x) => x.v), mn = Math.min(...vs), mx = Math.max(...vs), rng = mx - mn || 1, step = 96 / (pts.length - 1);
  const coords = pts.map((x, i) => [(i * step).toFixed(1), (25 - ((x.v - mn) / rng) * 22).toFixed(1)]);
  const last = coords[coords.length - 1];
  return '<svg class="spark" viewBox="-2 0 100 28" role="img" aria-label="Last ' + pts.length + ' results"><polyline points="' + coords.map((c) => c.join(",")).join(" ") + '" fill="none" style="stroke:var(--accent)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="' + last[0] + '" cy="' + last[1] + '" r="3" style="fill:var(--accent)"/></svg>';
}
function viewProgress() {
  const p = state.player, cur = currentStreak(p), lon = longestStreak(p);
  let html = '<div class="statrow"><div class="stat"><b>' + cur + '</b><span>Current streak</span></div><div class="stat"><b>' + lon + '</b><span>Best streak</span></div><div class="stat"><b>' + totalDays(p) + '</b><span>Days trained</span></div></div>';
  html += '<h3 class="sec-h">Badges</h3><div class="badges">' + BADGES.map((b) => {
    const got = lon >= b.n;
    return '<div class="badge' + (got ? ' earned' : '') + '">' + ICON.badge + '<b>' + b.n + '</b><span>' + b.label + '</span><span style="font-size:12px">' + (got ? 'Unlocked' : 'Locked') + '</span></div>';
  }).join("") + '</div>';
  const row = (label, unit, h) => {
    const pb = h.length ? Math.max(...h.map((x) => x.v)) : null, last = h.length ? h[h.length - 1].v : null;
    return '<tr><td>' + esc(label) + '</td><td class="num">' + (pb === null ? '—' : pb) + '<small>' + esc(unit) + '</small></td><td class="num">' + (last === null ? '—' : last) + '</td><td>' + spark(h) + '</td></tr>';
  };
  const head = (w) => '<thead><tr><th>' + w + '</th><th>Best</th><th>Last</th><th>Trend</th></tr></thead>';
  html += '<h3 class="sec-h">Basketball challenges</h3><div class="tablewrap"><table class="pbtable">' + head("Challenge") + '<tbody>' + challengesFor(p).map((id) => row(CHALLENGES[id].label, CHALLENGES[id].unit, history(p, { type: "ch", id }))).join("") + '</tbody></table></div>';
  html += '<h3 class="sec-h">Friday tests</h3><div class="tablewrap"><table class="pbtable">' + head("Test") + '<tbody>' + TESTS[p].map((t) => row(t.label, t.unit, history(p, { type: "test", id: t.id }))).join("") + '</tbody></table></div>';
  return html;
}
function viewGuide() {
  return '<div class="guide">' +
  '<section class="card"><h3>How the streak works</h3><ul>' +
    '<li>Finish every block of today\'s session (tick it, or run its timer to the end). The day turns orange and the streak grows.</li>' +
    '<li>Only Monday to Friday count. Weekends never break a streak.</li>' +
    '<li>Team practice or game day? Switch to <b>Team practice day</b>: warm-up, handles and the challenge only. It still counts.</li>' +
    '<li>Miss a weekday and the streak starts again from zero. Your best streak is kept.</li>' +
    '<li>Tap the ▶ next to any drill to see how it\'s done. During the timer, the animation shows the current drill; <b>Real demo</b> opens a video.</li>' +
  '</ul></section>' +
  '<section class="card"><h3>Harvell (U10) vs Jasper (U14)</h3><div class="tablewrap" style="border:0;padding:0"><table class="compare"><thead><tr><th></th><th>Harvell · U10</th><th>Jasper · U14</th></tr></thead><tbody>' +
    '<tr><td>Focus</td><td>Skill window: coordination, balance, landing, lots of touches</td><td>Speed window: first step, deceleration, bodyweight strength</td></tr>' +
    '<tr><td>Jumps</td><td>About 60–75 easy foot contacts, Tue and Fri</td><td>About 80–85 foot contacts, Tue and Fri</td></tr>' +
    '<tr><td>Strength</td><td>Bodyweight, short holds, 2 sets</td><td>Tempo and single-leg work, 2 sets of 6–15 reps</td></tr>' +
    '<tr><td>Shooting</td><td>Close range, form, both hands</td><td>Catch-and-shoot, corners, free throws when tired</td></tr>' +
    '<tr><td>Sleep</td><td>9–12 hours</td><td>8–10 hours</td></tr>' +
  '</tbody></table></div></section>' +
  '<section class="card"><h3>Safety rules</h3><ul>' +
    '<li>Sharp pain means stop and tell a parent. Sore knees or heels during a growth spurt: skip the jumps that day.</li>' +
    '<li>Every landing is quiet: soft knees, knees over toes, never caving in.</li>' +
    '<li>Technique before speed. A sloppy rep does not count.</li>' +
    '<li>Jasper: build muscle with these bodyweight progressions, food and sleep. Add weights later, only with a qualified coach.</li>' +
  '</ul></section>' +
  '<section class="card"><h3>Standards this plan follows</h3><ul>' +
    '<li><a href="https://youthguidelines.nba.com" target="_blank" rel="noopener">NBA & USA Basketball Youth Guidelines</a>: ages 9–11 up to 5 h of organized basketball a week with 2 rest days; ages 12–14 up to 10 h with 1 rest day.</li>' +
    '<li><a href="https://assets.website-files.com/5d24fc966ad064837947a33b/5ee2c5bbaaa13133cebedfbb_cb_adm_ltad.pdf" target="_blank" rel="noopener">Canada Basketball Athlete Development Model</a>: 9–12 is the skill window; 13–16 is the second speed window.</li>' +
    '<li><a href="https://www.nsca.com/globalassets/about/position-statements/position_stand_youth_resistance_training---2009.pdf" target="_blank" rel="noopener">NSCA youth resistance training position</a>: 1–3 sets of 6–15 reps, 2–3 days a week on non-consecutive days, technique first.</li>' +
    '<li><a href="https://www.ucalgary.ca/shred-injuries/all-sports/basketball" target="_blank" rel="noopener">SHRed Injuries Basketball warm-up</a>: a 10-minute neuromuscular warm-up that cut ankle and knee injuries by 36% in youth players.</li>' +
    '<li>Handles circuit: <a href="https://www.youtube.com/watch?v=moPEMNHmwc4" target="_blank" rel="noopener">Coach Rock, Revenge Basketball</a>.</li>' +
  '</ul></section></div>';
}

/* ---------------- Page events ---------------- */
document.querySelector(".players").addEventListener("click", (e) => {
  const b = e.target.closest(".player-btn"); if (!b) return;
  state.player = b.dataset.p; state.viewDay = null; lsSet("sc.player", state.player); render();
});
document.querySelector(".tabs").addEventListener("click", (e) => {
  const b = e.target.closest(".tab"); if (!b) return;
  state.tab = b.dataset.tab; render();
});
$("soundBtn").addEventListener("click", () => { state.sound = !state.sound; lsSet("sc.sound", state.sound); render(); });
$("panel").addEventListener("click", (e) => {
  const t = e.target.closest("button"); if (!t) return;
  const p = state.player, tk = keyOf(today());
  if (t.dataset.day) { state.viewDay = t.dataset.day; render(); return; }
  if (t.dataset.mode) {
    state.modePref = t.dataset.mode;
    if (getLog(p, tk)) updateLog(p, tk, (l) => { l.mode = t.dataset.mode; }); else render();
    return;
  }
  if (t.dataset.toggle) { const id = t.dataset.toggle; updateLog(p, tk, (l) => { l.blocks[id] = !l.blocks[id]; }); return; }
  if (t.dataset.start) { openTimer(t.dataset.start); return; }
  if (t.dataset.preview) { const [bid, idx] = t.dataset.preview.split(":"); openPreview(bid, +idx); return; }
  if (t.dataset.step) { stepInput(t); return; }
  if (t.dataset.savescore) { saveScore(t.dataset.savescore, $("score-today"), false); return; }
  if (t.dataset.savetests) { saveTests($("panel"), "test-"); }
});
function stepInput(btn) {
  const inp = $(btn.dataset.for); if (!inp) return;
  let v = parseInt(inp.value, 10); if (isNaN(v)) v = 0;
  inp.value = Math.max(0, Math.min(Number(inp.max) || 999, v + Number(btn.dataset.step)));
}
function readNum(inp, max) { if (!inp) return null; const v = parseInt(inp.value, 10); return isNaN(v) ? null : Math.max(0, Math.min(max, v)); }
function saveScore(chId, inp, fromTimer) {
  const p = state.player, tk = keyOf(today()), C = CHALLENGES[chId];
  const v = readNum(inp, C.max);
  if (v === null) { toast("Enter a score first."); return null; }
  const prevBest = best(p, { type: "ch", id: chId }, tk);
  const blockId = currentMode() === "lite" ? "challenge" : "skill";
  updateLog(p, tk, (l) => { l.score = { id: chId, value: v }; if (fromTimer) l.blocks[blockId] = true; });
  const isPb = prevBest === null ? v > 0 : v > prevBest;
  toast(isPb ? "New personal best: " + v + " " + C.unit + "!" : "Saved: " + v + " " + C.unit + ".");
  return isPb;
}
function saveTests(root, prefix) {
  const p = state.player, tk = keyOf(today()), got = {};
  TESTS[p].forEach((t) => { const v = readNum(root.querySelector("#" + prefix + t.id), t.max); if (v !== null) got[t.id] = v; });
  if (!Object.keys(got).length) { toast("Enter at least one test result."); return false; }
  const pbs = TESTS[p].filter((t) => got[t.id] !== undefined).filter((t) => { const b0 = best(p, { type: "test", id: t.id }, tk); return b0 === null ? got[t.id] > 0 : got[t.id] > b0; }).map((t) => t.label);
  updateLog(p, tk, (l) => { l.tests = Object.assign({}, l.tests || {}, got); });
  toast(pbs.length ? "New best: " + pbs.join(", ") + "!" : "Tests saved.");
  return true;
}
let toastTimer = 0;
function toast(msg) {
  let el = document.querySelector(".toast");
  if (!el) { el = document.createElement("div"); el.className = "toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
  el.textContent = msg; el.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 2800);
}
function celebrateDay(p) { setTimeout(() => toast(PROGRAM[p].name + ": day complete! Streak " + currentStreak(p) + "."), 300); chime([660, 880, 1320]); }

/* ---------------- Audio & wake lock ---------------- */
let AC = null;
function ensureAudio() { try { if (!AC) { const C = window.AudioContext || window.webkitAudioContext; if (C) AC = new C(); } if (AC && AC.state === "suspended") AC.resume(); } catch (e) { /* ignore */ } }
function beep(freq, dur, vol) {
  if (!state.sound || !AC) return;
  try {
    const o = AC.createOscillator(), g = AC.createGain(), t0 = AC.currentTime;
    o.type = "square"; o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.08, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(AC.destination); o.start(t0); o.stop(t0 + dur + 0.02);
  } catch (e) { /* ignore */ }
}
const chime = (freqs) => freqs.forEach((f, i) => setTimeout(() => beep(f, 0.18, 0.07), i * 140));
let wake = null;
function keepAwake(on) {
  try {
    if (on && navigator.wakeLock && !wake) navigator.wakeLock.request("screen").then((w) => { wake = w; }).catch(() => {});
    if (!on && wake) { wake.release().catch(() => {}); wake = null; }
  } catch (e) { /* ignore */ }
}

/* ---------------- Timer ---------------- */
const T = { block: null, segs: [], i: 0, remain: 0, endAt: 0, running: false, iv: 0, lastBeep: -1, evts: [], counts: true };
const stagePlayer = new Player($("t-canvas"));

function openTimer(blockId) {
  const p = state.player, td = currentDayKey(), day = state.viewDay || td || "mon";
  const mode = day === td ? currentMode() : "full";
  const bl = blocksFor(p, day, mode).find((b) => b.id === blockId);
  if (!bl) return;
  ensureAudio();
  T.block = bl; T.counts = day === td; T.segs = expand(bl.items); T.i = 0;
  document.documentElement.style.setProperty("--tc", state.player === "jasper" ? "#78A2F2" : "#F0783F");
  $("t-block").textContent = bl.title;
  $("t-run").hidden = false; $("t-ctrl").hidden = false; $("t-next").hidden = false; $("t-finish").hidden = true; $("t-stage").hidden = false;
  $("timer").hidden = false;
  document.body.style.overflow = "hidden";
  keepAwake(true);
  beginSeg();
  $("t-play").focus();
}
function closeTimer() {
  clearInterval(T.iv); T.running = false; stagePlayer.stop(); $("timer").hidden = true; document.body.style.overflow = ""; keepAwake(false); render();
}
function makeEvents(seg) {
  const ev = [];
  if (seg.kind === "reaction" || seg.kind === "arrows") {
    let t = seg.secs * 1000 - (seg.kind === "reaction" ? 2500 : 1500);
    while (t > 1500) {
      ev.push({ at: t, dir: seg.dirs ? seg.dirs[Math.floor(Math.random() * seg.dirs.length)] : null });
      t -= seg.kind === "reaction" ? 3500 + Math.random() * 3500 : 1800 + Math.random() * 1500;
    }
  }
  return ev;
}
function showStage(seg) {
  // during rest, show what's next
  let target = seg, tag = "How to";
  if (seg.kind === "rest") {
    const n = T.segs.slice(T.i + 1).find((s) => s.kind !== "rest");
    if (n) { target = n; tag = "Next up"; }
  }
  const spec = animFor(target.name);
  $("t-tag").textContent = tag;
  if (spec) { $("t-stage").hidden = false; stagePlayer.play(spec); if (!T.running) stagePlayer.pause(); }
  else { stagePlayer.stop(); $("t-stage").hidden = true; }
  T.stageTarget = target;
}
function beginSeg() {
  const s = T.segs[T.i];
  T.remain = s.secs * 1000; T.endAt = performance.now() + T.remain; T.running = true; T.lastBeep = -1;
  T.evts = makeEvents(s);
  beep(s.kind === "rest" ? 520 : 1040, 0.28, 0.09);
  paintSeg(); showStage(s);
  clearInterval(T.iv); T.iv = setInterval(tick, 100); tick();
}
function paintSeg() {
  const s = T.segs[T.i], n = T.segs[T.i + 1];
  const k = $("t-kind");
  k.textContent = { work: "Work", rest: "Rest", reaction: "React", arrows: "React", challenge: "Challenge" }[s.kind] || "Work";
  k.className = "t-kind" + (s.kind === "rest" ? " rest" : "");
  $("t-name").textContent = s.name;
  $("t-set").textContent = s.set || "";
  $("t-cue").textContent = s.cue || "";
  $("t-count").textContent = (T.i + 1) + " / " + T.segs.length;
  $("t-next").innerHTML = n ? 'Next: <b>' + esc(n.name) + '</b>' + (n.kind === "rest" ? '' : ' · ' + n.secs + ' s') : 'Last one. Finish strong.';
  $("t-play").textContent = T.running ? "Pause" : "Resume";
  $("t-signal").innerHTML = s.kind === "reaction" ? '<span class="wait">Wait for GO</span>' : s.kind === "arrows" ? '<span class="wait">Watch the arrow</span>' : "";
}
function tick() {
  if (!T.running) return;
  T.remain = Math.max(0, T.endAt - performance.now());
  const s = T.segs[T.i];
  const clock = $("t-clock"); clock.textContent = fmtClock(T.remain);
  clock.classList.toggle("hot", T.remain <= 3000 && s.kind !== "rest");
  const sec = Math.ceil(T.remain / 1000);
  if (sec <= 3 && sec >= 1 && sec !== T.lastBeep) { T.lastBeep = sec; beep(780, 0.09, 0.07); }
  while (T.evts.length && T.remain <= T.evts[0].at) {
    const ev = T.evts.shift(), sig = $("t-signal");
    if (s.kind === "reaction") { sig.innerHTML = '<span class="go flash">GO!</span>'; beep(1480, 0.2, 0.11); }
    else { sig.innerHTML = '<span class="flash" style="display:inline-flex">' + arrowSvg(ev.dir) + '</span>'; beep(ev.dir === "left" ? 900 : ev.dir === "right" ? 1200 : 1500, 0.12, 0.09); }
    try { if (navigator.vibrate) navigator.vibrate(80); } catch (e) { /* ignore */ }
    const snap = sig.innerHTML;
    setTimeout(() => { if (T.segs[T.i] === s && sig.innerHTML === snap && s.kind === "reaction") sig.innerHTML = '<span class="wait">Walk back · wait</span>'; }, 1100);
  }
  const done = T.segs.slice(0, T.i).reduce((a, x) => a + x.secs, 0) + (s.secs * 1000 - T.remain) / 1000, tot = T.segs.reduce((a, x) => a + x.secs, 0);
  $("t-prog").style.width = Math.min(100, done / tot * 100) + "%";
  if (T.remain <= 0) nextSeg();
}
function nextSeg() { if (T.i < T.segs.length - 1) { T.i++; beginSeg(); } else finishBlock(); }
function prevSeg() { if (T.i > 0) T.i--; beginSeg(); }
function pauseTimer() { if (T.running) { T.running = false; T.remain = Math.max(0, T.endAt - performance.now()); stagePlayer.pause(); $("t-play").textContent = "Resume"; } }
function resumeTimer() { if (!T.running && !$("t-run").hidden) { T.running = true; T.endAt = performance.now() + T.remain; stagePlayer.resume(); $("t-play").textContent = "Pause"; } }
function togglePlay() { ensureAudio(); if (T.running) pauseTimer(); else resumeTimer(); }

function finishBlock() {
  clearInterval(T.iv); T.running = false; stagePlayer.stop();
  chime([880, 1100, 1320]);
  $("t-prog").style.width = "100%";
  $("t-run").hidden = true; $("t-ctrl").hidden = true; $("t-next").hidden = true; $("t-stage").hidden = true;
  const fin = $("t-finish"); fin.hidden = false;
  const bl = T.block, p = state.player, tk = keyOf(today());
  if (!T.counts) {
    fin.innerHTML = '<h2>BLOCK DONE</h2><p>This was a preview. Only today\'s session counts toward the streak.</p><div class="row"><button type="button" class="big" data-fin="close">Back</button></div>';
    return;
  }
  if (bl.ch) {
    const C = CHALLENGES[bl.ch], l = getLog(p, tk), cur = l && l.score && l.score.id === bl.ch ? l.score.value : "";
    const pb = best(p, { type: "ch", id: bl.ch }, tk);
    fin.innerHTML = '<h2>' + esc(C.label.toUpperCase()) + '</h2><p>' + esc(C.how) + '</p><div class="row">' + stepperHtml("score-fin", cur, C.max) + '<span class="unit">' + esc(C.unit) + '</span></div><p>Personal best: <b>' + (pb === null ? '—' : pb) + '</b></p><div class="row"><button type="button" class="big" data-fin="score">Save score</button><button type="button" class="ghost" data-fin="skip">Skip score</button></div><div id="fin-msg" aria-live="polite"></div>';
    setTimeout(() => { const i = $("score-fin"); if (i) i.focus(); }, 50);
    return;
  }
  updateLog(p, tk, (l) => { l.blocks[bl.id] = true; });
  if (bl.test) {
    fin.innerHTML = '<h2>TEST RESULTS</h2><p>Enter what you got. Leave blank anything you skipped.</p><div class="tests">' + TESTS[p].map((t) =>
      '<div class="test"><label for="ft-' + t.id + '">' + esc(t.label) + '</label>' + stepperHtml("ft-" + t.id, "", t.max) + ' <span class="unit">' + esc(t.unit) + '</span></div>').join("") +
      '</div><div class="row"><button type="button" class="big" data-fin="tests">Save tests</button><button type="button" class="ghost" data-fin="close">Later</button></div>';
    return;
  }
  finishedScreen();
}
function finishedScreen(extra) {
  const p = state.player, td = currentDayKey(), mode = currentMode();
  const l = getLog(p, keyOf(today())), b = (l && l.blocks) || {};
  const next = blocksFor(p, td, mode).find((x) => !(b[x.id] || (x.id === "challenge" && b.skill)));
  const dayDone = l && l.complete;
  $("t-finish").innerHTML = (extra || '') + '<h2>' + (dayDone ? 'DAY COMPLETE' : 'BLOCK DONE') + '</h2><p>' + (dayDone ? 'Streak: ' + currentStreak(p) + '. See you tomorrow.' : 'Nice work. ' + (next ? 'Next up: ' + esc(next.title) + '.' : '')) + '</p><div class="row">' +
    (next && !dayDone ? '<button type="button" class="big" data-fin="next" data-next="' + next.id + '">Start ' + esc(next.title) + '</button>' : '') +
    '<button type="button" class="' + (next && !dayDone ? 'ghost' : 'big') + '" data-fin="close">Back to today</button></div>';
}
$("t-finish").addEventListener("click", (e) => {
  const t = e.target.closest("button"); if (!t) return;
  if (t.dataset.step) { stepInput(t); return; }
  const a = t.dataset.fin, p = state.player, tk = keyOf(today());
  if (a === "close") closeTimer();
  else if (a === "next") openTimer(t.dataset.next);
  else if (a === "skip") { updateLog(p, tk, (l) => { l.blocks[T.block.id] = true; }); finishedScreen(); }
  else if (a === "score") {
    const inp = $("score-fin");
    if (readNum(inp, CHALLENGES[T.block.ch].max) === null) { $("fin-msg").textContent = "Enter a score, or tap Skip score."; return; }
    const pb = saveScore(T.block.ch, inp, true);
    finishedScreen(pb ? '<div class="pb-flash flash">NEW PERSONAL BEST</div>' : '');
    if (pb) chime([1040, 1320, 1560, 2080]);
  } else if (a === "tests") { if (saveTests($("t-finish"), "ft-")) finishedScreen(); }
});
$("t-close").addEventListener("click", closeTimer);
$("t-play").addEventListener("click", togglePlay);
$("t-skip").addEventListener("click", () => nextSeg());
$("t-back").addEventListener("click", prevSeg);
$("t-video").addEventListener("click", () => {
  const target = T.stageTarget || T.segs[T.i];
  pauseTimer();
  openVideo(target.name, T.block.id, true);
});
document.addEventListener("keydown", (e) => {
  if (!$("modal").hidden) { if (e.key === "Escape") closeModal(); return; }
  if ($("timer").hidden) return;
  if (e.key === "Escape") closeTimer();
  if (e.key === " " && !$("t-run").hidden && e.target.tagName !== "INPUT" && e.target.tagName !== "BUTTON") { e.preventDefault(); togglePlay(); }
});
document.addEventListener("visibilitychange", () => { if (!document.hidden && !$("timer").hidden && T.running) { keepAwake(true); tick(); } });

/* ---------------- Preview & video modal ---------------- */
const modalPlayer = { p: null };
let resumeAfterModal = false;
function openModal(title, html) {
  $("m-title").textContent = title;
  $("m-body").innerHTML = html;
  $("modal").hidden = false;
  $("m-close").focus();
}
function closeModal() {
  if (modalPlayer.p) { modalPlayer.p.stop(); modalPlayer.p = null; }
  $("m-body").innerHTML = "";
  $("modal").hidden = true;
  if (resumeAfterModal) { resumeAfterModal = false; resumeTimer(); }
}
$("m-close").addEventListener("click", closeModal);
$("modal").addEventListener("click", (e) => {
  if (e.target === $("modal")) { closeModal(); return; }
  const b = e.target.closest("button[data-video]");
  if (b) openVideo(b.dataset.video, b.dataset.block, false);
});
function openPreview(blockId, idx) {
  const td = currentDayKey(), day = state.viewDay || td || "mon";
  const bl = blocksFor(state.player, day, day === td ? currentMode() : "full").find((b) => b.id === blockId);
  if (!bl) return;
  const it = bl.items[idx];
  const name = it.L ? it.n + " · Left" : it.n;
  const spec = animFor(name);
  openModal(it.n, '<div class="stage"><canvas id="m-canvas" role="img" aria-label="Animated demo of ' + esc(it.n) + '"></canvas></div><p class="cue">' + esc(it.c) + '</p>' +
    '<p class="small">' + itemTime(it) + (it.L ? ' · the animation shows the left side; mirror it for the right.' : '') + '</p>' +
    '<div class="row"><button type="button" class="btn" data-video="' + esc(it.n) + '" data-block="' + blockId + '">' + ICON.play + 'Real demo video</button></div>');
  if (spec) { modalPlayer.p = new Player($("m-canvas")); modalPlayer.p.play(spec); }
}
const displayName = (name) => /^(W\d|\d\d) /.test(name) ? name : name.replace(/ · (Left|Right)$/, "");
function openVideo(name, blockId, fromTimer) {
  const v = videoFor(name, blockId);
  if (modalPlayer.p) { modalPlayer.p.stop(); modalPlayer.p = null; }
  if (fromTimer) resumeAfterModal = true;
  if (v.type === "embed") {
    openModal(displayName(name), '<div class="vid"><iframe src="' + embedUrl(v) + '" title="Demo video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>' +
      '<p class="small">' + esc(v.by) + (v.alt ? ' · shows the whole warm-up' : '') + '</p><div class="row"><a class="btn ghost" href="' + watchUrl(v) + '" target="_blank" rel="noopener">Open on YouTube</a>' +
      (v.alt ? '<a class="btn ghost" href="' + v.alt.url + '" target="_blank" rel="noopener">Find a video for this drill</a>' : '') + '</div>');
  } else {
    openModal(displayName(name), '<p class="cue">No hand-picked video for this drill yet. Open a YouTube search for it:</p><div class="row"><a class="btn" href="' + v.url + '" target="_blank" rel="noopener">Search YouTube: “' + esc(v.q) + '”</a></div><p class="small">Pick a short video from a coach or trainer. The animation above shows the key positions.</p>');
  }
}

/* ---------------- Auth gate ---------------- */
function showGate(text, err, canSwitch) {
  $("gate").hidden = false; $("app").hidden = true;
  $("gate-text").textContent = text;
  $("gate-err").textContent = err || "";
  $("signin").hidden = !!canSwitch;
  $("gate-signout").hidden = !canSwitch;
}
$("signin").addEventListener("click", () => { $("gate-err").textContent = ""; store.signIn().catch((e) => { $("gate-err").textContent = e.message; }); });
$("gate-signout").addEventListener("click", () => store.signOutUser());
$("signout").addEventListener("click", () => store.signOutUser());

store.on("user", (u) => {
  state.user = u;
  if (!u) { showGate("Sign in to track Harvell's and Jasper's training."); return; }
  $("gate").hidden = true; $("app").hidden = false;
  $("demo").hidden = !u.demo; $("signout").hidden = !!u.demo;
  render();
});
store.on("logs", (l) => { logs = l || {}; if (state.user && $("timer").hidden) render(); else if (state.user) renderHero(); });
store.on("status", (s) => {
  state.status = s.mode;
  const txt = { demo: "Demo mode", connecting: "Connecting…", synced: s.pending ? "Saving…" : "Synced", offline: "Offline · saved here", error: "Sync problem" }[s.mode];
  if (txt) $("sync").textContent = txt;
  if (s.mode === "denied") {
    showGate("This Google account (" + (state.user && state.user.email) + ") isn't on the list yet.", "Ask H to add it to firestore.rules, or sign in with another account.", true);
  }
  if (s.mode === "error" && s.message && !$("gate").hidden) $("gate-err").textContent = s.message;
});

/* midnight rollover */
let lastDay = keyOf(today());
setInterval(() => { const k = keyOf(today()); if (k !== lastDay) { lastDay = k; state.viewDay = null; if ($("timer").hidden && state.user) render(); } }, 60000);

store.start();

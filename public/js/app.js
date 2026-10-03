import { CHALLENGES, TESTS, PROGRAM_DAYS, WEEK_MAX, PHASES, GROUPS, AGES, groupForAge, sessionFor, phaseOf, isTestDay, BADGES, MILESTONES, BONUS, BONUS_XP, BONUS_MAX } from "./program.js";
import { animFor } from "./drills.js";
import { Player } from "./anim.js";
import { videoFor, embedUrl, watchUrl } from "./videos.js";
import { dayXp, targetFor, XP_RULES, TARGETS, fmtXp } from "./scoring.js";
import { AVATARS, avatarHtml, nicknameProblem, cleanNickname } from "./avatars.js";
import { keyOf, addDays, isWeekday, today, mondayOf, currentStreak, longestStreak, sessionsBefore, weekCount, liveStreak, liveWeekXp, nextStats, newLog, weekBonus, nextBonus, totalXp } from "./stats.js";
import * as store from "./store.js";

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function lsGet(k, fb) { try { const v = localStorage.getItem(k); return v === null ? fb : JSON.parse(v); } catch (e) { return fb; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }

/* ---------------- state ---------------- */
const state = {
  user: null, prof: { state: "loading" }, tab: "today", sound: lsGet("sc.sound", true), modePref: "full",
  viewGroup: lsGet("sc.viewGroup", "10-11"), mapDay: null, makeup: false, status: "connecting", wantCard: false,
  board: { kind: "week", filter: "all", cache: {}, loading: false, error: "" }, confirmDelete: false
};
let logs = {};

const pub = () => (state.prof.state === "ready" ? state.prof.pub : null);
const isPlayer = () => !!pub();
const myGroup = () => (pub() ? pub().group : state.viewGroup);
const myAge = () => { const a = state.prof.priv && state.prof.priv.age; return a || (myGroup() === "10-11" ? 10 : 12); };
const myUid = () => (pub() ? pub().uid : null);
const tk = () => keyOf(today());
const idFor = (date) => myUid() + "_" + date;
const todayLog = () => (isPlayer() ? logs[idFor(tk())] || null : null);
const allLogs = () => Object.values(logs).filter(Boolean);
const daysDone = () => allLogs().filter((l) => l.complete).length;
function todayN() { const l = todayLog(); return l && l.day ? l.day : sessionsBefore(logs, tk()) + 1; }
const todaySession = () => sessionFor(myGroup(), todayN());

/* ---------------- blocks & segments ---------------- */
function blocksFor(s, mode) {
  const warm = { id: "warmup", kind: "Injury-proof warm-up", title: "Warm-up", items: s.warmup };
  const ath = { id: "athletic", kind: "Athletic", title: s.athletic.title, items: s.athletic.items, test: s.test };
  const han = { id: "handles", kind: "Handles", title: s.handles.title, items: s.handles.items };
  const ski = { id: "skill", kind: "Basketball", title: s.skill.title, items: s.skill.items, ch: s.ch };
  const str = { id: "strength", kind: "Strength & core", title: s.strength.title, items: s.strength.items };
  if (mode === "lite") return [warm, han, { id: "challenge", kind: "Basketball", title: CHALLENGES[s.ch].label, items: s.skill.items.filter((it) => it.t === "challenge"), ch: s.ch }];
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
const requiredBlocks = (mode) => (mode === "lite" ? ["warmup", "handles", "challenge"] : ["warmup", "athletic", "handles", "skill", "strength"]);
const blockDone = (b, id) => (id === "challenge" ? !!(b.challenge || b.skill) : !!b[id]);
const blocksDoneCount = (l) => requiredBlocks(l.mode).filter((id) => blockDone(l.blocks || {}, id)).length;
const isComplete = (l) => requiredBlocks(l.mode).every((id) => blockDone(l.blocks || {}, id));

/* ---------------- training rules for today ---------------- */
function trainState() {
  const t = today(), k = keyOf(t);
  if (!isPlayer()) return { ok: false, reason: "viewer" };
  if (todayLog()) return { ok: true };
  if (weekCount(logs, k) >= WEEK_MAX) return { ok: false, reason: "week" };
  if (!isWeekday(t)) return state.makeup ? { ok: true, makeup: true } : { ok: false, reason: "weekend" };
  return { ok: true };
}

/* ---------------- bests ---------------- */
function history(metric) {
  return allLogs().map((l) => {
    let v = null;
    if (metric.type === "ch" && l.score && l.score.id === metric.id) v = l.score.value;
    if (metric.type === "test" && l.tests && typeof l.tests[metric.id] === "number") v = l.tests[metric.id];
    return v === null || v === undefined ? null : { date: l.date, v: Number(v) };
  }).filter(Boolean).sort((a, b) => (a.date < b.date ? -1 : 1));
}
function best(metric, excludeDate) {
  const h = history(metric).filter((x) => x.date !== excludeDate);
  return h.length ? Math.max(...h.map((x) => x.v)) : null;
}
function pbToday(l) {
  let pb = false;
  if (l.score && typeof l.score.value === "number") { const b0 = best({ type: "ch", id: l.score.id }, l.date); if (b0 !== null && l.score.value > b0) pb = true; }
  Object.keys(l.tests || {}).forEach((tid) => { const b0 = best({ type: "test", id: tid }, l.date); if (b0 !== null && l.tests[tid] > b0) pb = true; });
  return pb;
}
function challengesForGroup(g) {
  const seen = [];
  for (let n = 1; n <= 10; n++) { const c = sessionFor(g, n).ch; if (!seen.includes(c)) seen.push(c); }
  return seen;
}

/* ---------------- saving today ---------------- */
function updateToday(fn) {
  const P = pub(); if (!P) return null;
  const date = tk(), id = idFor(date), cur = logs[id];
  const s = todaySession();
  const l = cur ? JSON.parse(JSON.stringify(cur)) : newLog({ uid: P.uid, date, day: s.n, group: P.group, mode: state.modePref });
  fn(l);
  l.group = P.group;
  l.complete = isComplete(l);
  const after = Object.assign({}, logs, { [id]: l });
  const streak = currentStreak(after, date);
  const parts = dayXp({ blocksDone: blocksDoneCount(l), chId: l.score ? l.score.id : null, value: l.score ? l.score.value : null, age: myAge(), pb: pbToday(l), complete: l.complete, streak });
  l.xp = parts.total; l.parts = { blocks: parts.blocks, challenge: parts.challenge, pb: parts.pb, streak: parts.streak }; l.updatedAt = Date.now();
  const wasComplete = cur ? !!cur.complete : false;
  const stats = store.logsReady() ? nextStats(P, { date, dayXp: l.xp, dayDone: l.complete, logsAfter: after }) : null;
  logs = after;
  if (stats) Object.assign(P, stats);
  render();
  store.saveDay(l, stats).catch((e) => { console.error(e); toast("Couldn't save. Check your connection and try again."); });
  if (l.complete && !wasComplete) celebrateDay(l);
  return l;
}

/* ---------------- icons ---------------- */
const ICON = {
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  play: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg>',
  flame: '<svg viewBox="0 0 34 42" aria-hidden="true"><path d="M17 2c2 8 12 12 12 24a12 12 0 0 1-24 0c0-6 3-10 6-13 0 5 2 8 5 9-2-7 0-14 1-20z" style="fill:var(--accent)"/><path d="M17 22c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 4 3 4-1-3-1-6 0-9z" style="fill:var(--surface)"/></svg>',
  flameSm: '<svg viewBox="0 0 34 42" aria-hidden="true"><path d="M17 2c2 8 12 12 12 24a12 12 0 0 1-24 0c0-6 3-10 6-13 0 5 2 8 5 9-2-7 0-14 1-20z" fill="currentColor"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>',
  badge: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="20" r="15" fill="none" stroke="currentColor" stroke-width="3"/><path d="M9 20h30M24 5v30M14 9c4 4 4 18 0 22M34 9c-4 4-4 18 0 22" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 33l-3 12 11-5 11 5-3-12" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>',
  cap: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 9l10-5 10 5-10 5z" fill="currentColor"/><path d="M6 11.5V16c3 2.5 9 2.5 12 0v-4.5l-6 3z" fill="currentColor"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" stroke-width="2.6"/></svg>'
};
function arrowSvg(dir) {
  const rot = dir === "left" ? 180 : dir === "up" ? -90 : 0;
  return '<svg viewBox="0 0 100 100" aria-label="' + dir + '" role="img"><g transform="rotate(' + rot + ' 50 50)"><path d="M12 50h62M52 24l26 26-26 26" fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/></g></svg>';
}

/* ---------------- render ---------------- */
function tabsFor() { return isPlayer() ? ["today", "program", "board", "progress", "guide"] : ["program", "board", "guide"]; }
const TAB_LABEL = { today: "Today", program: "Program", board: '<span class="lg">Leaderboard</span><span class="sm">Ranks</span>', progress: "Progress", guide: "Guide" };
function render() {
  document.documentElement.setAttribute("data-group", myGroup());
  if (!tabsFor().includes(state.tab)) state.tab = tabsFor()[0];
  $("tabs").innerHTML = tabsFor().map((t) => '<button class="tab" role="tab" id="tab-' + t + '" data-tab="' + t + '" aria-selected="' + (t === state.tab) + '" type="button">' + TAB_LABEL[t] + '</button>').join("");
  const sb = $("soundBtn"); sb.textContent = state.sound ? "Sound on" : "Sound off"; sb.setAttribute("aria-pressed", String(state.sound));
  const P = pub();
  $("meBtn").innerHTML = P ? avatarHtml(P.avatar, "sm") + '<span>' + esc(P.nickname) + '</span>' : '<span>Coach view</span>';
  $("viewerbar").hidden = isPlayer();
  if (!isPlayer()) $("viewerbar").innerHTML = viewerBar();
  $("hero").hidden = !isPlayer() || state.tab !== "today";
  if (isPlayer()) renderHero();
  const panel = $("panel");
  panel.setAttribute("aria-labelledby", "tab-" + state.tab);
  const v = { today: viewToday, program: viewProgram, board: viewBoard, progress: viewProgress, guide: viewGuide }[state.tab];
  panel.innerHTML = v();
}

function viewerBar() {
  const btn = (g) => '<button class="player-btn" type="button" data-vgroup="' + g + '" aria-pressed="' + (state.viewGroup === g) + '"><span class="pn">' + esc(GROUPS[g].label.toUpperCase()) + '</span><span class="pg">' + (g === "10-11" ? "U12" : "U16") + '</span></button>';
  return '<div class="note"><b>Coach view.</b> Browse the program for either age group and follow the leaderboard. Players sign in on their own phones and make their own player card.</div>' +
    '<div class="players" role="group" aria-label="Age group">' + btn("10-11") + btn("12-15") + '</div>' +
    '<div><button type="button" class="btn ghost" data-act="make-card">Make a player card on this account</button></div>';
}

function renderHero() {
  const P = pub(), t = today(), k = keyOf(t);
  const cur = currentStreak(logs, k), lon = longestStreak(logs), monday = mondayOf(t);
  const doneSet = new Set(allLogs().filter((l) => l.complete).map((l) => l.date));
  const dots = ["Mon", "Tue", "Wed", "Thu", "Fri"].map((d, i) => {
    const dd = addDays(monday, i), kk = keyOf(dd);
    let cls = "dot", inner = d.charAt(0);
    if (doneSet.has(kk)) { cls += " done"; inner = ICON.check; }
    else if (kk === k) cls += " today";
    else if (dd < t) { cls += " miss"; inner = ICON.x; }
    return '<div class="wd"><div class="' + cls + '" aria-label="' + d + (doneSet.has(kk) ? " done" : "") + '">' + inner + '</div><span>' + d.toUpperCase() + '</span></div>';
  }).join("");
  const done = daysDone(), shown = Math.min(done, PROGRAM_DAYS);
  const seg = PHASES.map((ph) => {
    const len = ph.to - ph.from + 1, fill = Math.max(0, Math.min(len, shown - ph.from + 1));
    return '<i style="flex:' + len + '"><u style="width:' + Math.round(fill / len * 100) + '%"></u></i>';
  }).join("");
  const n = todayN(), ph = phaseOf(Math.min(n, PROGRAM_DAYS));
  const progLbl = done >= PROGRAM_DAYS ? "<b>Graduated.</b> Bonus days: " + (done - PROGRAM_DAYS) : "<b>" + done + " of " + PROGRAM_DAYS + "</b> days done · " + esc(ph.name);
  const wk = weekCount(logs, k) + (todayLog() && todayLog().complete ? 1 : 0);
  const ts = trainState(), tl = todayLog();
  const sub = tl && tl.complete ? "Today is done. See you tomorrow." : ts.reason === "week" ? "5 sessions this week. Rest up." : ts.reason === "weekend" ? "Weekend rest. The streak waits for Monday." : cur > 0 ? "Train today to keep it alive." : "Finish today's session to start one.";
  $("hero").innerHTML =
    '<div class="streak"><div class="streak-num">' + ICON.flame + '<b>' + cur + '</b></div><div><div class="streak-lbl">Day streak</div><div class="streak-sub">Best ' + lon + ' · ' + fmtXp(totalXp(P)) + ' XP</div></div></div>' +
    '<div class="hero-right"><div class="week" aria-label="This week">' + dots + '</div>' +
    '<div class="prog"><div class="nb-row"><span>' + progLbl + '</span><span>' + wk + '/' + WEEK_MAX + ' this week</span></div><div class="phasebar" aria-hidden="true">' + seg + '</div></div>' +
    '<div class="streak-sub">' + sub + '</div></div>';
}

/* ---------------- session blocks (shared by Today and the program map) ---------------- */
function blocksHtml(s, mode, ctx, log, counting) {
  const b = (log && log.blocks) || {};
  return '<div class="blocks">' + blocksFor(s, mode).map((bl) => {
    const isDone = blockDone(b, bl.id);
    const items = bl.items.map((it, idx) => {
      const canPrev = it.t !== "rest" && !!animFor(it.L ? it.n + " · Left" : it.n);
      return '<li class="' + (it.t === "challenge" ? "ch" : "") + '"><span class="in">' + esc(it.n) + '</span><span class="it">' + itemTime(it) + (it.r ? ' · rest ' + it.r + ' s' : '') + '</span>' +
        (canPrev ? '<button type="button" class="pv prev" data-preview="' + ctx + ':' + bl.id + ':' + idx + '" aria-label="Show how to do ' + esc(it.n) + '">' + ICON.play + '</button>' : '<span></span>') +
        '<span class="ic">' + esc(it.c) + '</span></li>';
    }).join("");
    return '<article class="block' + (isDone ? ' is-done' : '') + '"><div class="bmain">' +
      (counting ? '<button type="button" class="check" data-toggle="' + bl.id + '" aria-label="Mark ' + esc(bl.title) + (isDone ? ' not done' : ' done') + '">' + ICON.check + '</button>' : '<span class="check ghostcheck" aria-hidden="true"></span>') +
      '<div class="binfo"><div class="bk">' + esc(bl.kind) + '</div><div class="bt">' + esc(bl.title) + '</div><div class="bm">' + fmtMin(blockSecs(bl)) + ' · ' + bl.items.length + ' drills' + (bl.ch ? ' · challenge: ' + esc(CHALLENGES[bl.ch].label) : '') + '</div></div>' +
      '<button type="button" class="start" data-start="' + bl.id + '" data-ctx="' + ctx + '">' + ICON.play + (counting ? (isDone ? 'Again' : 'Start') : 'Try') + '</button>' +
      '</div><details><summary>Drills</summary><ul class="items">' + items + '</ul></details></article>';
  }).join("") + '</div>';
}
function sessionHead(s) {
  const ph = s.bonus ? "Bonus day · Game Speed" : s.phase.id === 4 ? "Finals" : "Phase " + s.phase.id + " · " + s.phase.name;
  const chips = '<span class="chip">' + esc(ph) + '</span>' + (s.test ? '<span class="chip accent">Test day</span>' : '') +
    (s.kind === "final" ? '<span class="chip accent">Graduation</span>' : '');
  return '<div class="dayno"><b>DAY ' + s.n + '</b><span>' + (s.bonus ? 'bonus day' : 'of ' + PROGRAM_DAYS) + '</span>' + chips + '</div>' +
    '<div class="daytitle"><h2>' + esc(s.title) + '</h2><span class="chip">' + fmtMin(blocksFor(s, "full").reduce((a, x) => a + blockSecs(x), 0)) + ' total</span></div>';
}

/* ---------------- Today ---------------- */
function viewToday() {
  const s = todaySession(), log = todayLog(), ts = trainState();
  const counting = ts.ok;
  const mode = log ? log.mode : state.modePref;
  let html = '<div class="dayhead">' + sessionHead(s);
  if (ts.reason === "weekend") {
    html += '<div class="note">Weekend: rest, play another sport, or just play. Missed a session this week? You can do a make-up session (max ' + WEEK_MAX + ' a week). Make-ups count for your days and XP, not your streak.' +
      '<div style="margin-top:8px"><button type="button" class="btn" data-act="makeup">Start a make-up session</button></div></div>';
  } else if (ts.reason === "week") {
    html += '<div class="note">You already trained ' + WEEK_MAX + ' times this week. Rest is part of the program. Day ' + s.n + ' is ready on Monday. You can still look through it below.</div>';
  } else if (ts.makeup) {
    html += '<div class="note">Make-up session. It counts for your days and XP.</div>';
  }
  if (daysDone() >= PROGRAM_DAYS && !(log && log.complete)) html += '<div class="note"><b>You finished the 67-day program.</b> Keep going with bonus days: they repeat the Game Speed phase, and your streak and XP keep counting.</div>';
  html += '</div>';
  if (!counting) html += bonusCard();
  const full = blocksFor(s, "full").reduce((a, x) => a + blockSecs(x), 0), lite = blocksFor(s, "lite").reduce((a, x) => a + blockSecs(x), 0);
  html += '<div class="mode" role="group" aria-label="Session length">' +
    '<button type="button" data-mode="full" aria-pressed="' + (mode === "full") + '"' + (counting ? '' : ' disabled') + '><b>Full session</b><small>' + fmtMin(full) + '</small></button>' +
    '<button type="button" data-mode="lite" aria-pressed="' + (mode === "lite") + '"' + (counting ? '' : ' disabled') + '><b>Team practice day</b><small>' + fmtMin(lite) + ' · still counts</small></button></div>';
  if (log && log.complete) {
    html += '<div class="done-banner">' + ICON.check + '<div><b>Day ' + s.n + ' complete</b><span>Streak: ' + currentStreak(logs, tk()) + '. Sleep well tonight (' + GROUPS[myGroup()].sleep + ').</span></div></div>';
  }
  if (counting) html += xpCard(log, mode);
  html += blocksHtml(s, mode, "today", log, counting);
  const C = CHALLENGES[s.ch], target = targetFor(s.ch, myAge());
  if (counting) {
    const curScore = log && log.score && log.score.id === s.ch ? log.score.value : "";
    const pb = best({ type: "ch", id: s.ch }, tk());
    html += '<section class="card" aria-labelledby="ch-h"><h3 id="ch-h">Today\'s challenge · ' + esc(C.label) + '</h3><p>' + esc(C.how) + ' Full points at <b>' + target + ' ' + esc(C.unit) + '</b> (target for age ' + myAge() + ').</p><div class="scorerow">' +
      stepperHtml("score-today", curScore, C.max) + ' <span class="unit">' + esc(C.unit) + '</span> <button type="button" class="save" data-savescore="' + s.ch + '">Save score</button></div>' +
      '<div class="pbline">Personal best: <b>' + (pb === null ? '—' : pb + ' ' + esc(C.unit)) + '</b>' + (curScore !== "" ? ' · Today: <b>' + curScore + '</b>' : '') + '</div></section>';
    if (s.test && mode === "full") html += testsCard(log);
    html += bonusCard();
  } else {
    html += '<section class="card"><h3>Challenge · ' + esc(C.label) + '</h3><p>' + esc(C.how) + ' Full points at ' + target + ' ' + esc(C.unit) + '.</p></section>';
  }
  html += kokohCard();
  return html;
}
function bonusCard(readonly) {
  const wb = weekBonus(pub(), tk());
  const rows = BONUS[myGroup()].map((it) => {
    const done = !!wb.done[it.id];
    const canPrev = !!animFor(it.L ? it.n + " · Left" : it.n);
    return '<li class="brow2' + (done ? ' done' : '') + '">' +
      (readonly ? '<span class="check ghostcheck" aria-hidden="true"></span>' : '<button type="button" class="check" data-bonus="' + it.id + '" aria-pressed="' + done + '" aria-label="' + (done ? 'Undo ' : 'Mark done: ') + esc(it.n) + '">' + ICON.check + '</button>') +
      '<span class="bn">' + (canPrev ? '<button type="button" class="bn-link" data-bpreview="' + it.id + '" aria-label="Show how to do ' + esc(it.n) + '"><b>' + esc(it.n) + '</b><span class="pvi">' + ICON.play + '</span></button>' : '<b>' + esc(it.n) + '</b>') +
      '<small>' + esc(it.kind) + ' · ' + itemTime(it) + (it.r ? ' · rest ' + it.r + ' s' : '') + (done ? ' · <em>+' + BONUS_XP + ' XP</em>' : '') + '</small></span>' +
      '<button type="button" class="start" data-bstart="' + it.id + '">' + ICON.play + (readonly ? 'Try' : done ? 'Again' : 'Start') + '</button>' +
      '<span class="ic">' + esc(it.c) + '</span></li>';
  }).join("");
  return '<section class="card bonuscard" aria-labelledby="bonus-h"><div class="bonus-top"><h3 id="bonus-h">Weekly bonus</h3>' + (readonly ? '' : '<span class="chip accent">+' + wb.xp + ' / ' + BONUS_MAX + ' XP</span>') + '</div>' +
    '<p>Extra strength and stretching for any day, even rest days. Each exercise gives +' + BONUS_XP + ' XP once a week. Resets every Monday.</p>' +
    (readonly ? '' : '<div class="bar" aria-hidden="true"><i style="width:' + Math.round(wb.xp / BONUS_MAX * 100) + '%"></i></div>') + '<ul class="bonus-list">' + rows + '</ul></section>';
}
function kokohCard() {
  const key = myGroup() === "10-11" ? "ku10" : "ku14";
  return '<section class="card kokohcard" aria-labelledby="kokoh-h"><h3 id="kokoh-h">Lari Kokoh · extra program</h3>' +
    '<p>Strength and stability so you stay solid in sprints, sudden stops, cuts and contact. 2–3 times a week, with animations, set timers and demo videos (in Bahasa Indonesia). Nothing here changes your XP.</p>' +
    '<a class="btn" href="/kokoh/' + key + '">' + ICON.play + 'Open Lari Kokoh ' + key.toUpperCase() + '</a></section>';
}
function setBonus(id, on) {
  const P = pub(); if (!P) return;
  if (!!weekBonus(P, tk()).done[id] === on) return;
  const patch = nextBonus(P, { date: tk(), id, on });
  if (!patch) { toast("Check the date and time on this phone."); return; }
  Object.assign(P, patch);
  if ($("timer").hidden) render(); else renderHero();
  store.saveBonus(patch).catch((e) => { console.error(e); toast("Couldn't save. Check your connection and try again."); });
  if (on) { toast("Weekly bonus: +" + BONUS_XP + " XP"); chime([880, 1320]); }
}
function xpCard(log, mode) {
  const p = (log && log.parts) || { blocks: 0, challenge: 0, pb: 0, streak: 0 };
  const maxBlocks = requiredBlocks(mode).length * XP_RULES.block;
  return '<section class="card xpcard" aria-label="Today\'s points"><div class="xp-top"><b>' + ((log && log.xp) || 0) + '</b><span>XP today · max ' + XP_RULES.dayMax + '</span></div>' +
    '<div class="xp-parts"><span>Blocks <b>' + p.blocks + '</b>/' + maxBlocks + '</span><span>Challenge <b>' + p.challenge + '</b>/' + XP_RULES.challenge + '</span><span>Personal best <b>+' + p.pb + '</b></span><span>Streak <b>+' + p.streak + '</b></span></div></section>';
}
function stepperHtml(id, val, max) {
  return '<span class="stepper"><button type="button" data-step="-1" data-for="' + id + '" aria-label="Minus one">−</button><input id="' + id + '" type="number" inputmode="numeric" min="0" max="' + max + '" value="' + (val === "" || val === null || val === undefined ? "" : val) + '" placeholder="0" aria-label="Score"><button type="button" data-step="1" data-for="' + id + '" aria-label="Plus one">+</button></span>';
}
function testsCard(log) {
  const vals = (log && log.tests) || {};
  const fields = TESTS[myGroup()].map((t) => {
    const pb = best({ type: "test", id: t.id }, tk());
    return '<div class="test"><label for="test-' + t.id + '">' + esc(t.label) + '</label>' + stepperHtml("test-" + t.id, typeof vals[t.id] === "number" ? vals[t.id] : "", t.max) + ' <span class="unit">' + esc(t.unit) + '</span><div class="pbline">' + esc(t.how) + ' Best: <b>' + (pb === null ? '—' : pb) + '</b></div></div>';
  }).join("");
  return '<section class="card" aria-labelledby="tests-h"><h3 id="tests-h">Test day</h3><p>Test yourself every fifth day. Beat your last numbers for a personal-best bonus.</p><div class="tests">' + fields + '</div><div style="margin-top:12px"><button type="button" class="save" data-savetests="1">Save tests</button></div></section>';
}

/* ---------------- Program map ---------------- */
// Players unlock days one at a time: finished days get a tick, the next day is open, later days are locked.
// Coach view (no player card) can open every day.
function mapState() {
  const player = isPlayer(), done = player ? daysDone() : 0;
  const next = Math.min(PROGRAM_DAYS, done + 1);
  return { player, done, next, unlocked: (d) => !player || d <= done + 1 };
}
function viewProgram() {
  const g = myGroup(), M = mapState(), n = M.player ? todayN() : 0;
  if (!state.mapDay || !M.unlocked(state.mapDay)) state.mapDay = M.player ? M.next : 1;
  const sel = state.mapDay;
  let html = '<div class="phases">' + PHASES.map((ph) => {
    const cur = M.player && n >= ph.from && n <= ph.to;
    return '<div class="phase p' + ph.id + (cur ? ' cur' : '') + '"><div class="ph-top"><b>' + esc(ph.name) + '</b><span>Days ' + ph.from + '–' + ph.to + '</span></div><p>' + esc(ph.goal) + '</p></div>';
  }).join("") + '</div>';
  html += '<h3 class="sec-h">67-day map · ' + esc(GROUPS[g].label) + '</h3><p class="small">' +
    (M.player ? 'Finish a day to unlock the next one. Tap an open day to see its plan.' : 'Coach view: every day is open. Players unlock days one at a time.') + '</p><div class="map" role="group" aria-label="Program days">';
  for (let d = 1; d <= PROGRAM_DAYS; d++) {
    const ph = phaseOf(d), cls = ["cell", "p" + ph.id];
    const done = M.player && d <= M.done, locked = !M.unlocked(d), next = M.player && d === M.next && !done;
    if (done) cls.push("done"); else if (locked) cls.push("locked");
    if (next) cls.push("cur");
    if (isTestDay(d)) cls.push("test");
    const label = 'Day ' + d + (done ? ', done' : locked ? ', locked' : next ? ', next' : '') + (isTestDay(d) ? ', test day' : '');
    html += '<button type="button" class="' + cls.join(" ") + '" data-mapday="' + d + '"' + (locked ? ' data-locked="1" aria-disabled="true"' : '') + ' aria-pressed="' + (d === sel) + '" aria-label="' + label + '">' +
      '<span class="num">' + d + '</span>' + (done ? '<span class="cbadge ok" aria-hidden="true">' + ICON.check + '</span>' : locked ? '<span class="cbadge lock" aria-hidden="true">' + ICON.lock + '</span>' : '') + '</button>';
  }
  html += '</div>';
  if (M.player) html += '<div class="maplegend" aria-hidden="true"><span><i class="lg ok">' + ICON.check + '</i>Done</span><span><i class="lg next"></i>Next</span><span><i class="lg lock">' + ICON.lock + '</i>Locked</span><span><i class="lg test"></i>Test day</span></div>';
  const s = sessionFor(g, sel), tl = todayLog();
  let note = 'Preview: timers run, but nothing is saved.';
  if (M.player && sel <= M.done) note = 'Day ' + sel + ' is done. You can look back at it any time; timers here don\'t save.';
  else if (M.player && sel === M.next) note = tl && tl.complete ? 'Your next session. It opens on the Today tab on your next training day.' : 'This is your next session. Train it from the Today tab.';
  html += '<section class="mapday" aria-live="polite">' + sessionHead(s) +
    '<p class="small">' + note + '</p>' +
    blocksHtml(s, "full", "map", null, false) +
    '<section class="card"><h3>Challenge · ' + esc(CHALLENGES[s.ch].label) + '</h3><p>' + esc(CHALLENGES[s.ch].how) + '</p></section></section>';
  if (!M.player) html += bonusCard(true);
  html += '<section class="card"><h3>How a week works</h3><ul class="plain">' +
    '<li>Sessions run in a 5-day cycle: speed, jumps, defense, first step, then test day. Each session also has handles (7 min) and a basketball block with a scored challenge (10 min).</li>' +
    '<li>Physical work is about 20 minutes a day: warm-up 5, athletic 7–8, strength 7.</li>' +
    '<li>Train Monday to Friday. Missed a day? Nothing is skipped: the next session is simply the next day number.</li>' +
    '<li>Up to ' + WEEK_MAX + ' sessions a week. Weekends are for rest or a make-up session.</li></ul></section>';
  return html;
}

/* ---------------- Leaderboard ---------------- */
function loadBoard(force) {
  const B = state.board, kind = B.kind, c = B.cache[kind];
  if (B.loading) return;
  if (c && !force && Date.now() - c.at < 120000) return;
  B.loading = true; B.error = "";
  store.fetchBoard(kind).then((list) => { B.cache[kind] = { list, at: Date.now() }; })
    .catch((e) => { console.error(e); B.error = "Couldn't load the leaderboard. Check your connection."; })
    .finally(() => { B.loading = false; if (state.tab === "board" && $("timer").hidden) render(); });
}
function viewBoard() {
  const B = state.board, c = B.cache[B.kind], admin = state.user && state.user.admin;
  if (!c) loadBoard(false);
  const seg = (k, lbl) => '<button type="button" data-bkind="' + k + '" aria-pressed="' + (B.kind === k) + '">' + lbl + '</button>';
  const flt = (k, lbl) => '<button type="button" class="fchip" data-bfilter="' + k + '" aria-pressed="' + (B.filter === k) + '">' + lbl + '</button>';
  let html = '<div class="boardbar"><div class="seg" role="group" aria-label="Period">' + seg("week", "This week") + seg("all", "All time") + '</div>' +
    '<div class="filters" role="group" aria-label="Age group">' + flt("all", "All ages") + flt("10-11", "10–11") + flt("12-15", "12–15") + '</div></div>';
  if (!c) return html + '<div class="card"><p>' + (B.error ? esc(B.error) : 'Loading the leaderboard…') + '</p>' + (B.error ? '<button type="button" class="btn" data-act="board-refresh">Try again</button>' : '') + '</div>' + fairCard();
  const t = tk(), me = myUid();
  let rows = c.list.filter((p) => admin || !p.hidden || p.uid === me).map((p) => Object.assign({}, p, { score: B.kind === "week" ? liveWeekXp(p, t) + weekBonus(p, t).xp : totalXp(p), live: liveStreak(p, t) }));
  if (B.filter !== "all") rows = rows.filter((p) => p.group === B.filter);
  if (B.kind === "week") rows = rows.filter((p) => p.score > 0 || p.uid === me);
  rows.sort((a, b) => b.score - a.score || b.live - a.live || (b.days || 0) - (a.days || 0) || String(a.nickname).localeCompare(String(b.nickname)));
  if (!rows.length) html += '<div class="card"><p>' + (B.kind === "week" ? 'Nobody has trained yet this week. Be the first.' : 'No players yet.') + '</p></div>';
  else {
    html += '<ol class="board">' + rows.map((p, i) => {
      const rank = i + 1, mine = p.uid === me;
      return '<li class="brow' + (mine ? ' me' : '') + (p.hidden ? ' hid' : '') + '"><span class="rank r' + Math.min(rank, 4) + '">' + rank + '</span>' + avatarHtml(p.avatar) +
        '<span class="bname"><b>' + esc(p.nickname || "Player") + '</b>' + (mine ? '<em>You</em>' : '') + ((p.days || 0) >= PROGRAM_DAYS ? '<span class="grad" title="Graduated">' + ICON.cap + '</span>' : '') +
        '<small>' + esc(GROUPS[p.group] ? GROUPS[p.group].short : "") + ' · ' + Math.min(p.days || 0, PROGRAM_DAYS) + '/' + PROGRAM_DAYS + ' days' + (p.hidden ? ' · hidden' : '') + '</small>' +
        (admin && !mine && !(state.user && state.user.demo) ? '<button type="button" class="linkbtn" data-hide="' + esc(p.uid) + ':' + (p.hidden ? '0' : '1') + '">' + (p.hidden ? 'Show' : 'Hide') + '</button>' : '') + '</span>' +
        '<span class="bstreak" title="Day streak">' + ICON.flameSm + p.live + '</span><span class="bxp"><b>' + fmtXp(p.score) + '</b><small>XP</small></span></li>';
    }).join("") + '</ol>';
  }
  const ago = Math.round((Date.now() - c.at) / 60000);
  html += '<div class="boardfoot"><span class="small">' + (B.loading ? 'Updating…' : 'Updated ' + (ago < 1 ? 'just now' : ago + ' min ago')) + '</span><button type="button" class="btn ghost" data-act="board-refresh">' + ICON.refresh + 'Refresh</button></div>';
  return html + fairCard();
}
function fairCard() {
  return '<section class="card"><h3>Same rules for everyone</h3><ul class="plain">' +
    '<li>Each finished block: <b>10 XP</b> (5 blocks = 50).</li>' +
    '<li>Challenge: up to <b>30 XP</b>, measured against the target for <b>your age</b>. Hit your target and you get the full 30, whether you are 10 or 15.</li>' +
    '<li>New personal best (challenge or test): <b>+10 XP</b>. Everyone can beat their own best.</li>' +
    '<li>Streak bonus: <b>+1 XP</b> per streak day, up to +10.</li>' +
    '<li>Weekly bonus: <b>+' + BONUS_XP + ' XP</b> for each bonus exercise (push-ups, sit-ups, plank, kayang, stretches…), each once a week, up to +' + BONUS_MAX + '.</li>' +
    '<li>Max <b>100 XP a day</b> from sessions and ' + WEEK_MAX + ' sessions a week, so extra sessions can\'t buy points. <b>This week</b> resets every Monday, so new players can win it too.</li></ul></section>';
}

/* ---------------- Progress ---------------- */
function spark(h) {
  if (h.length < 2) return '<span class="unit">' + (h.length ? '1 entry' : 'No entries') + '</span>';
  const pts = h.slice(-10), vs = pts.map((x) => x.v), mn = Math.min(...vs), mx = Math.max(...vs), rng = mx - mn || 1, step = 96 / (pts.length - 1);
  const coords = pts.map((x, i) => [(i * step).toFixed(1), (25 - ((x.v - mn) / rng) * 22).toFixed(1)]);
  const last = coords[coords.length - 1];
  return '<svg class="spark" viewBox="-2 0 100 28" role="img" aria-label="Last ' + pts.length + ' results"><polyline points="' + coords.map((c) => c.join(",")).join(" ") + '" fill="none" style="stroke:var(--accent)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="' + last[0] + '" cy="' + last[1] + '" r="3" style="fill:var(--accent)"/></svg>';
}
function viewProgress() {
  const P = pub(), cur = currentStreak(logs, tk()), lon = longestStreak(logs), done = daysDone();
  let html = '<div class="statrow four"><div class="stat"><b>' + fmtXp(totalXp(P)) + '</b><span>Total XP</span></div><div class="stat"><b>' + done + '</b><span>Days done</span></div><div class="stat"><b>' + cur + '</b><span>Streak</span></div><div class="stat"><b>' + lon + '</b><span>Best streak</span></div></div>';
  html += '<h3 class="sec-h">Program milestones</h3><div class="badges">' + MILESTONES.map((m) => {
    const got = done >= m.n;
    return '<div class="badge' + (got ? ' earned' : '') + '">' + (m.n === PROGRAM_DAYS ? ICON.cap : ICON.badge) + '<b>' + m.n + '</b><span>' + esc(m.label) + '</span><span class="small">' + (got ? 'Unlocked' : 'Day ' + m.n) + '</span></div>';
  }).join("") + '</div>';
  html += '<h3 class="sec-h">Streak badges</h3><div class="badges">' + BADGES.map((b) => {
    const got = lon >= b.n;
    return '<div class="badge' + (got ? ' earned' : '') + '">' + ICON.badge + '<b>' + b.n + '</b><span>' + esc(b.label) + '</span><span class="small">' + (got ? 'Unlocked' : 'Locked') + '</span></div>';
  }).join("") + '</div>';
  const row = (label, unit, h, target) => {
    const pb = h.length ? Math.max(...h.map((x) => x.v)) : null, last = h.length ? h[h.length - 1].v : null;
    return '<tr><td>' + esc(label) + '</td><td class="num">' + (pb === null ? '—' : pb) + '<small>' + esc(unit) + '</small></td><td class="num opt">' + (last === null ? '—' : last) + '</td>' + (target !== undefined ? '<td class="num">' + target + '</td>' : '') + '<td>' + spark(h) + '</td></tr>';
  };
  html += '<h3 class="sec-h">Basketball challenges</h3><div class="tablewrap"><table class="pbtable"><thead><tr><th>Challenge</th><th>Best</th><th class="opt">Last</th><th>Target</th><th>Trend</th></tr></thead><tbody>' +
    challengesForGroup(myGroup()).map((id) => row(CHALLENGES[id].label, CHALLENGES[id].unit, history({ type: "ch", id }), targetFor(id, myAge()))).join("") + '</tbody></table></div>';
  html += '<h3 class="sec-h">Tests</h3><div class="tablewrap"><table class="pbtable"><thead><tr><th>Test</th><th>Best</th><th class="opt">Last</th><th>Trend</th></tr></thead><tbody>' +
    TESTS[myGroup()].map((t) => row(t.label, t.unit, history({ type: "test", id: t.id }))).join("") + '</tbody></table></div>';
  return html;
}

/* ---------------- Guide ---------------- */
function targetsTable() {
  const g = myGroup(), ages = AGES.filter((a) => groupForAge(a) === g);
  const head = '<tr><th>Challenge</th>' + ages.map((a) => '<th' + (isPlayer() && a === myAge() ? ' class="hl"' : '') + '>Age ' + a + '</th>').join("") + '</tr>';
  const rows = challengesForGroup(g).map((id) => '<tr><td>' + esc(CHALLENGES[id].label) + ' <span class="small">(' + esc(CHALLENGES[id].unit) + ')</span></td>' + ages.map((a) => '<td' + (isPlayer() && a === myAge() ? ' class="hl"' : '') + '>' + TARGETS[id][a] + '</td>').join("") + '</tr>').join("");
  return '<div class="tablewrap" style="border:0;padding:0"><table class="compare"><thead>' + head + '</thead><tbody>' + rows + '</tbody></table></div>';
}
function viewGuide() {
  return '<div class="guide">' + kokohCard() +
  '<section class="card"><h3>How it works</h3><ul>' +
    '<li><b>67 days.</b> Day 1 is your first finished session, Day 67 your graduation. Missed a day? Nothing is skipped: you just do the next day number.</li>' +
    '<li><b>Your streak</b> counts weekdays in a row with a finished session. Weekends never break it. Miss a weekday and it starts again; your best streak is kept.</li>' +
    '<li>Finish every block of today\'s session (tick it, or run its timer to the end). Team practice or a game? Switch to <b>Team practice day</b>: warm-up, handles and the challenge. It still counts.</li>' +
    '<li>Up to ' + WEEK_MAX + ' sessions a week. On weekends you can do a make-up session if you missed one.</li>' +
    '<li><b>Weekly bonus</b> (on the Today tab): push-ups, sit-ups, plank, glute bridge, kayang, cium lutut and more stretches. Do them any day, even on rest days. Each one gives +' + BONUS_XP + ' XP once a week.</li>' +
    '<li>Tap ▶ next to any drill to see how it\'s done. During a timer, the animation shows the current drill and <b>Real demo</b> opens a video.</li>' +
  '</ul></section>' +
  '<section class="card"><h3>Fair points</h3><p>Everyone earns XP by the same rules (max 100 a day). Challenge points compare you with the target for your age, so younger players can top the board too.</p>' +
    '<ul><li>Finished block: 10 XP each.</li><li>Challenge: up to 30 XP. Your score ÷ your age target, capped at 100%.</li><li>New personal best: +10 XP.</li><li>Streak bonus: +1 per day, up to +10.</li><li>Weekly bonus: +' + BONUS_XP + ' XP per bonus exercise, each once a week (up to +' + BONUS_MAX + ').</li></ul>' +
    '<p style="margin-top:10px"><b>Targets for ' + esc(GROUPS[myGroup()].label) + '</b> (score for full points)</p>' + targetsTable() + '</section>' +
  '<section class="card"><h3>What the 67 days build</h3><div class="tablewrap" style="border:0;padding:0"><table class="compare"><thead><tr><th></th><th>Ages 10–11</th><th>Ages 12–15</th></tr></thead><tbody>' +
    '<tr><td>Focus</td><td>Skill window: coordination, balance, landing, lots of touches</td><td>Speed window: first step, stopping, single-leg strength</td></tr>' +
    '<tr><td>Days 1–20</td><td>Form shooting, layups both hands, handles standing still</td><td>Catch and shoot, finishing through contact, handles standing still</td></tr>' +
    '<tr><td>Days 21–45</td><td>5-spot shooting, reverse layups, jab and go, in-and-out and between the legs</td><td>Relocating, floaters, reverse layups, pull-ups off one dribble</td></tr>' +
    '<tr><td>Days 46–65</td><td>Crossover pull-ups, crossover into layups, euro steps, handles on the move</td><td>Step-backs, crossover pull-ups, shooting tired, handles on the move</td></tr>' +
    '<tr><td>Jumps</td><td>Stick every landing first, then two in a row</td><td>Bounds and double jumps, then low depth drops</td></tr>' +
    '<tr><td>Sleep</td><td>9–12 hours</td><td>8–10 hours</td></tr>' +
  '</tbody></table></div><p class="small" style="margin-top:8px">67 sessions take you from basics to a solid intermediate level. Game-level moves also need real games: keep playing with your team.</p></section>' +
  '<section class="card"><h3>Safety rules</h3><ul>' +
    '<li>Sharp pain means stop and tell a parent. Sore knees or heels during a growth spurt: skip the jumps that day.</li>' +
    '<li>Every landing is quiet: soft knees, knees over toes, never caving in.</li>' +
    '<li>Technique before speed. A sloppy rep does not count.</li>' +
    '<li>Ages 12–15: build strength with these bodyweight progressions, food and sleep. Add weights later, only with a qualified coach.</li>' +
    '<li>Play fair: only tick what you really did. Points only mean something if they\'re real.</li>' +
  '</ul></section>' +
  '<section class="card"><h3>Standards this plan follows</h3><ul>' +
    '<li><a href="https://youthguidelines.nba.com" target="_blank" rel="noopener">NBA & USA Basketball Youth Guidelines</a>: ages 9–11 up to 5 h of organized basketball a week with 2 rest days; ages 12–14 up to 10 h with 1 rest day.</li>' +
    '<li><a href="https://assets.website-files.com/5d24fc966ad064837947a33b/5ee2c5bbaaa13133cebedfbb_cb_adm_ltad.pdf" target="_blank" rel="noopener">Canada Basketball Athlete Development Model</a>: 9–12 is the skill window; 13–16 is the second speed window.</li>' +
    '<li><a href="https://www.nsca.com/globalassets/about/position-statements/position_stand_youth_resistance_training---2009.pdf" target="_blank" rel="noopener">NSCA youth resistance training position</a>: 1–3 sets of 6–15 reps, 2–3 days a week, technique first.</li>' +
    '<li><a href="https://www.ucalgary.ca/shred-injuries/all-sports/basketball" target="_blank" rel="noopener">SHRed Injuries Basketball warm-up</a>: a 10-minute neuromuscular warm-up that cut ankle and knee injuries by 36% in youth players.</li>' +
    '<li>Handles circuit: <a href="https://www.youtube.com/watch?v=moPEMNHmwc4" target="_blank" rel="noopener">Coach Rock, Revenge Basketball</a>.</li>' +
  '</ul></section>' +
  '<section class="card"><h3>Privacy</h3><ul>' +
    '<li>The leaderboard shows your nickname, avatar, age group, days, streak and XP. It never shows your email, photo or exact age.</li>' +
    '<li>Use a nickname, not your full name. Delete your data any time from your player card (top right).</li>' +
  '</ul></section></div>';
}

/* ---------------- profile form (onboarding + edit) ---------------- */
function profileForm(v, create) {
  const ages = AGES.map((a) => '<button type="button" class="agechip" data-age="' + a + '" aria-pressed="' + (v.age === a) + '">' + a + '</button>').join("");
  const avs = AVATARS.map((a) => '<button type="button" class="avpick" data-av="' + a.id + '" aria-pressed="' + (v.avatar === a.id) + '" aria-label="' + a.id + '">' + avatarHtml(a.id) + '</button>').join("");
  return '<div class="pform">' +
    '<label class="flabel" for="pf-nick">Nickname</label><input id="pf-nick" class="finput" maxlength="16" autocomplete="off" value="' + esc(v.nickname || "") + '" placeholder="e.g. Rocket">' +
    '<p class="fhint">Shown on the leaderboard. Use a nickname, not your full name.</p>' +
    '<span class="flabel">Age</span><div class="ages" role="group" aria-label="Age">' + ages + '</div>' +
    '<p class="fhint">Your program and your challenge targets are set by age.' + (v.age ? ' Program: <b>' + esc(GROUPS[groupForAge(v.age)].label) + '</b>.' : '') + '</p>' +
    '<span class="flabel">Avatar</span><div class="avgrid" role="group" aria-label="Avatar">' + avs + '</div>' +
    (create ? '<label class="consent"><input type="checkbox" id="pf-consent"' + (v.consent ? ' checked' : '') + '> <span>A parent or guardian knows I\'m using 67 Days Streak Court and says it\'s OK.</span></label>' : '') +
    '<p class="err" id="pf-err" role="alert"></p>' +
    '<button type="button" class="btn big" id="pf-save">' + (create ? 'Start Day 1' : 'Save changes') + '</button></div>';
}
const form = { nickname: "", age: null, avatar: null, consent: false };
function readForm(root) {
  const nick = root.querySelector("#pf-nick"); if (nick) form.nickname = nick.value;
  const c = root.querySelector("#pf-consent"); if (c) form.consent = c.checked;
}
function formEvents(root, create) {
  root.addEventListener("click", (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.age) { readForm(root); form.age = +t.dataset.age; paintForm(root, create); return; }
    if (t.dataset.av) { readForm(root); form.avatar = t.dataset.av; paintForm(root, create); return; }
    if (t.id === "pf-save") { readForm(root); submitForm(root, create, t); }
  });
}
function paintForm(root, create) {
  const host = root.querySelector(".pform-host"); if (!host) return;
  host.innerHTML = profileForm(form, create);
}
async function submitForm(root, create, btn) {
  const err = root.querySelector("#pf-err");
  const nick = cleanNickname(form.nickname), prob = nicknameProblem(nick);
  if (prob) { err.textContent = prob; return; }
  if (!form.age) { err.textContent = "Pick your age."; return; }
  if (!form.avatar) { err.textContent = "Pick an avatar."; return; }
  if (create && !form.consent) { err.textContent = "Ask a parent or guardian first, then tick the box."; return; }
  btn.disabled = true; err.textContent = "";
  const data = { nickname: nick, age: form.age, avatar: form.avatar, group: groupForAge(form.age) };
  try {
    if (create) await store.createProfile(data); else { await store.updateProfile(data); closeModal(); toast("Saved."); }
  } catch (e) { console.error(e); err.textContent = "Couldn't save. Check your connection and try again."; btn.disabled = false; }
}

/* ---------------- onboarding + profile modal ---------------- */
function showOnboard() {
  $("gate").hidden = true; $("app").hidden = true; $("onboard").hidden = false;
  $("ob-email").textContent = state.user && state.user.email ? "Signed in as " + state.user.email : "";
  paintForm($("onboard"), true);
}
formEvents($("onboard"), true);
$("ob-viewer").addEventListener("click", () => store.setViewer(true));
$("ob-signout").addEventListener("click", () => store.signOutUser());

function openProfile() {
  const P = pub();
  state.confirmDelete = false;
  if (!P) {
    openModal("Coach view", '<p class="cue">You\'re browsing without a player card' + (state.user && state.user.email ? ' (' + esc(state.user.email) + ')' : '') + '.</p><div class="row"><button type="button" class="btn" data-act="make-card">Make a player card</button>' + (state.user && !state.user.demo ? '<button type="button" class="btn ghost" data-act="signout">Sign out</button>' : '') + '</div>');
    return;
  }
  Object.assign(form, { nickname: P.nickname, age: myAge(), avatar: P.avatar, consent: true });
  openModal("Your player card", '<div class="pform-host">' + profileForm(form, false) + '</div>' +
    '<p class="small">Changing your age moves you to that age group\'s program and targets. Your days, streak and XP stay.</p>' +
    '<div class="danger"><h4>Account</h4><div class="row">' + (state.user && !state.user.demo ? '<button type="button" class="btn ghost" data-act="signout">Sign out</button>' : '') +
    '<button type="button" class="btn ghost warn" data-act="delete">Delete my data</button></div><p class="small" id="del-msg"></p></div>');
}
$("m-body").addEventListener("click", (e) => {
  const t = e.target.closest("button"); if (!t) return;
  if (t.dataset.age || t.dataset.av || t.id === "pf-save") {
    const host = $("m-body");
    readForm(host);
    if (t.dataset.age) { form.age = +t.dataset.age; host.querySelector(".pform-host").innerHTML = profileForm(form, false); }
    else if (t.dataset.av) { form.avatar = t.dataset.av; host.querySelector(".pform-host").innerHTML = profileForm(form, false); }
    else submitForm(host, false, t);
    return;
  }
  if (t.dataset.act === "signout") { closeModal(); store.signOutUser(); return; }
  if (t.dataset.act === "make-card") { closeModal(); state.wantCard = true; store.setViewer(false); route(); return; }
  if (t.dataset.act === "delete") {
    if (!state.confirmDelete) { state.confirmDelete = true; t.textContent = "Tap again to delete everything"; $("del-msg").textContent = "This removes your player card, every session and your place on the leaderboard. It can't be undone."; return; }
    t.disabled = true; $("del-msg").textContent = "Deleting…";
    store.deleteMyData().then(() => { closeModal(); logs = {}; toast("Your data is deleted."); }).catch((err) => { console.error(err); t.disabled = false; $("del-msg").textContent = "Couldn't delete. Check your connection and try again."; });
  }
});

/* ---------------- page events ---------------- */
$("tabs").addEventListener("click", (e) => {
  const b = e.target.closest(".tab"); if (!b) return;
  state.tab = b.dataset.tab; render();
});
$("soundBtn").addEventListener("click", () => { state.sound = !state.sound; lsSet("sc.sound", state.sound); render(); });
$("meBtn").addEventListener("click", openProfile);
$("viewerbar").addEventListener("click", (e) => {
  const t = e.target.closest("button"); if (!t) return;
  if (t.dataset.vgroup) { state.viewGroup = t.dataset.vgroup; lsSet("sc.viewGroup", state.viewGroup); render(); }
  if (t.dataset.act === "make-card") { state.wantCard = true; store.setViewer(false); route(); }
});
$("panel").addEventListener("click", (e) => {
  const t = e.target.closest("button"); if (!t) return;
  if (t.dataset.mapday) {
    if (t.dataset.locked) { toast("Day " + t.dataset.mapday + " is locked. Finish Day " + mapState().next + " first."); return; }
    state.mapDay = +t.dataset.mapday; render();
    const m = document.querySelector(".mapday"); if (m) m.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (t.dataset.mode) {
    state.modePref = t.dataset.mode;
    if (todayLog()) updateToday((l) => { l.mode = t.dataset.mode; }); else render();
    return;
  }
  if (t.dataset.toggle) { const id = t.dataset.toggle; updateToday((l) => { l.blocks[id] = !l.blocks[id]; }); return; }
  if (t.dataset.start) { openTimer(t.dataset.start, t.dataset.ctx); return; }
  if (t.dataset.preview) { const [ctx, bid, idx] = t.dataset.preview.split(":"); openPreview(ctx, bid, +idx); return; }
  if (t.dataset.step) { stepInput(t); return; }
  if (t.dataset.savescore) { saveScore(t.dataset.savescore, $("score-today"), false); return; }
  if (t.dataset.savetests) { saveTests($("panel"), "test-"); return; }
  if (t.dataset.bkind) { state.board.kind = t.dataset.bkind; render(); return; }
  if (t.dataset.bfilter) { state.board.filter = t.dataset.bfilter; render(); return; }
  if (t.dataset.hide) {
    const [uid, h] = t.dataset.hide.split(":");
    store.setHidden(uid, h === "1").then(() => { toast(h === "1" ? "Hidden from the leaderboard." : "Shown on the leaderboard."); loadBoard(true); }).catch(() => toast("Couldn't change that. Try again."));
    return;
  }
  if (t.dataset.act === "board-refresh") { loadBoard(true); render(); return; }
  if (t.dataset.act === "makeup") { state.makeup = true; render(); return; }
  if (t.dataset.bonus) { setBonus(t.dataset.bonus, t.getAttribute("aria-pressed") !== "true"); return; }
  if (t.dataset.bstart) { openTimer("bonus", "bonus:" + t.dataset.bstart); return; }
  if (t.dataset.bpreview) { openPreview("bonus:" + t.dataset.bpreview, "bonus", 0); }
});
function stepInput(btn) {
  const inp = $(btn.dataset.for); if (!inp) return;
  let v = parseInt(inp.value, 10); if (isNaN(v)) v = 0;
  inp.value = Math.max(0, Math.min(Number(inp.max) || 999, v + Number(btn.dataset.step)));
}
function readNum(inp, max) { if (!inp) return null; const v = parseInt(inp.value, 10); return isNaN(v) ? null : Math.max(0, Math.min(max, v)); }
function saveScore(chId, inp, fromTimer) {
  const C = CHALLENGES[chId], v = readNum(inp, C.max);
  if (v === null) { toast("Enter a score first."); return null; }
  const prevBest = best({ type: "ch", id: chId }, tk());
  const blockId = (todayLog() ? todayLog().mode : state.modePref) === "lite" ? "challenge" : "skill";
  updateToday((l) => { l.score = { id: chId, value: v }; if (fromTimer) l.blocks[blockId] = true; });
  const isPb = prevBest !== null && v > prevBest;
  toast(isPb ? "New personal best: " + v + " " + C.unit + "! +10 XP" : prevBest === null ? "Saved: " + v + " " + C.unit + ". That's your first score to beat." : "Saved: " + v + " " + C.unit + ".");
  return isPb;
}
function saveTests(root, prefix) {
  const got = {};
  TESTS[myGroup()].forEach((t) => { const v = readNum(root.querySelector("#" + prefix + t.id), t.max); if (v !== null) got[t.id] = v; });
  if (!Object.keys(got).length) { toast("Enter at least one test result."); return false; }
  const pbs = TESTS[myGroup()].filter((t) => got[t.id] !== undefined).filter((t) => { const b0 = best({ type: "test", id: t.id }, tk()); return b0 !== null && got[t.id] > b0; }).map((t) => t.label);
  updateToday((l) => { l.tests = Object.assign({}, l.tests || {}, got); });
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
function celebrateDay(l) {
  const done = daysDone();
  if (done === PROGRAM_DAYS) {
    setTimeout(() => openModal("Graduation", '<div class="gradcard">' + ICON.cap + '<h2>DAY 67 DONE</h2><p>You finished the whole program: ' + PROGRAM_DAYS + ' sessions. Keep your streak going with bonus days.</p></div>'), 400);
    chime([660, 880, 1100, 1320, 1760]);
    return;
  }
  setTimeout(() => toast("Day " + l.day + " complete! Streak " + currentStreak(logs, tk()) + " · +" + l.xp + " XP"), 300);
  chime([660, 880, 1320]);
}

/* ---------------- audio & wake lock ---------------- */
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

/* ---------------- timer ---------------- */
const T = { block: null, segs: [], i: 0, remain: 0, endAt: 0, running: false, iv: 0, lastBeep: -1, evts: [], counts: true, ctx: "today" };
const stagePlayer = new Player($("t-canvas"));
function ctxSession(ctx) { return ctx === "map" ? sessionFor(myGroup(), state.mapDay || 1) : todaySession(); }
function ctxMode(ctx) { if (ctx === "map") return "full"; const l = todayLog(); return l ? l.mode : state.modePref; }
// A block to run or preview: a session block, or one weekly-bonus exercise ("bonus:<id>").
function ctxBlock(blockId, ctx) {
  if (ctx && ctx.indexOf("bonus:") === 0) {
    const it = BONUS[myGroup()].find((b) => b.id === ctx.slice(6));
    return it ? { id: "bonus", kind: "Weekly bonus", title: it.n, items: [it], bonusId: it.id } : null;
  }
  return blocksFor(ctxSession(ctx), ctxMode(ctx)).find((b) => b.id === blockId) || null;
}

function openTimer(blockId, ctx) {
  ctx = ctx || "today";
  const bl = ctxBlock(blockId, ctx);
  if (!bl) return;
  ensureAudio();
  T.block = bl; T.ctx = ctx; T.counts = bl.bonusId ? isPlayer() : ctx === "today" && trainState().ok; T.segs = expand(bl.items); T.i = 0;
  document.documentElement.style.setProperty("--tc", myGroup() === "12-15" ? "#78A2F2" : "#F0783F");
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
  const bl = T.block;
  if (bl.bonusId && T.counts) {
    const already = !!weekBonus(pub(), tk()).done[bl.bonusId];
    setBonus(bl.bonusId, true);
    const wb = weekBonus(pub(), tk());
    fin.innerHTML = '<h2>BONUS DONE</h2><p>' + (already ? 'Already counted this week. Extra reps still make you stronger.' : '+' + BONUS_XP + ' XP.') + ' Weekly bonus: ' + wb.xp + ' / ' + BONUS_MAX + ' XP.</p><div class="row"><button type="button" class="big" data-fin="close">Back</button></div>';
    return;
  }
  if (!T.counts) {
    fin.innerHTML = '<h2>BLOCK DONE</h2><p>This was a preview, so nothing was saved.</p><div class="row"><button type="button" class="big" data-fin="close">Back</button></div>';
    return;
  }
  if (bl.ch) {
    const C = CHALLENGES[bl.ch], l = todayLog(), cur = l && l.score && l.score.id === bl.ch ? l.score.value : "";
    const pb = best({ type: "ch", id: bl.ch }, tk());
    fin.innerHTML = '<h2>' + esc(C.label.toUpperCase()) + '</h2><p>' + esc(C.how) + '</p><div class="row">' + stepperHtml("score-fin", cur, C.max) + '<span class="unit">' + esc(C.unit) + '</span></div><p>Personal best: <b>' + (pb === null ? '—' : pb) + '</b> · Full points at <b>' + targetFor(bl.ch, myAge()) + '</b></p><div class="row"><button type="button" class="big" data-fin="score">Save score</button><button type="button" class="ghost" data-fin="skip">Skip score</button></div><div id="fin-msg" aria-live="polite"></div>';
    setTimeout(() => { const i = $("score-fin"); if (i) i.focus(); }, 50);
    return;
  }
  updateToday((l) => { l.blocks[bl.id] = true; });
  if (bl.test) {
    fin.innerHTML = '<h2>TEST RESULTS</h2><p>Enter what you got. Leave blank anything you skipped.</p><div class="tests">' + TESTS[myGroup()].map((t) =>
      '<div class="test"><label for="ft-' + t.id + '">' + esc(t.label) + '</label>' + stepperHtml("ft-" + t.id, "", t.max) + ' <span class="unit">' + esc(t.unit) + '</span></div>').join("") +
      '</div><div class="row"><button type="button" class="big" data-fin="tests">Save tests</button><button type="button" class="ghost" data-fin="close">Later</button></div>';
    return;
  }
  finishedScreen();
}
function finishedScreen(extra) {
  const l = todayLog(), b = (l && l.blocks) || {}, mode = l ? l.mode : state.modePref;
  const next = blocksFor(todaySession(), mode).find((x) => !blockDone(b, x.id));
  const dayDone = l && l.complete;
  $("t-finish").innerHTML = (extra || '') + '<h2>' + (dayDone ? 'DAY ' + l.day + ' COMPLETE' : 'BLOCK DONE') + '</h2><p>' + (dayDone ? 'Streak: ' + currentStreak(logs, tk()) + ' · +' + l.xp + ' XP today. See you tomorrow.' : 'Nice work. ' + (l ? l.xp + ' XP so far. ' : '') + (next ? 'Next up: ' + esc(next.title) + '.' : '')) + '</p><div class="row">' +
    (next && !dayDone ? '<button type="button" class="big" data-fin="next" data-next="' + next.id + '">Start ' + esc(next.title) + '</button>' : '') +
    '<button type="button" class="' + (next && !dayDone ? 'ghost' : 'big') + '" data-fin="close">Back to today</button></div>';
}
$("t-finish").addEventListener("click", (e) => {
  const t = e.target.closest("button"); if (!t) return;
  if (t.dataset.step) { stepInput(t); return; }
  const a = t.dataset.fin;
  if (a === "close") closeTimer();
  else if (a === "next") openTimer(t.dataset.next, "today");
  else if (a === "skip") { updateToday((l) => { l.blocks[T.block.id] = true; }); finishedScreen(); }
  else if (a === "score") {
    const inp = $("score-fin");
    if (readNum(inp, CHALLENGES[T.block.ch].max) === null) { $("fin-msg").textContent = "Enter a score, or tap Skip score."; return; }
    const pb = saveScore(T.block.ch, inp, true);
    finishedScreen(pb ? '<div class="pb-flash flash">NEW PERSONAL BEST · +10 XP</div>' : '');
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

/* ---------------- preview & video modal ---------------- */
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
function openPreview(ctx, blockId, idx) {
  const bl = ctxBlock(blockId, ctx);
  if (!bl) return;
  const it = bl.items[idx];
  const name = it.L ? it.n + " · Left" : it.n;
  const spec = animFor(name);
  openModal(it.n, '<div class="stage"><canvas id="m-canvas" role="img" aria-label="Animated demo of ' + esc(it.n) + '"></canvas></div><p class="cue">' + esc(it.c) + '</p>' +
    '<p class="small">' + itemTime(it) + (it.L ? ' · the animation shows the left side; mirror it for the right.' : '') + '</p>' +
    '<div class="row"><button type="button" class="btn" data-video="' + esc(it.n) + '" data-block="' + blockId + '">' + ICON.play + 'Real demo video</button></div>');
  if (spec) { modalPlayer.p = new Player($("m-canvas")); modalPlayer.p.play(spec); }
}
const displayName = (name) => (/^(W\d|\d\d) /.test(name) ? name : name.replace(/ · (Left|Right)$/, ""));
function openVideo(name, blockId, fromTimer) {
  const v = videoFor(name, blockId);
  if (modalPlayer.p) { modalPlayer.p.stop(); modalPlayer.p = null; }
  if (fromTimer) resumeAfterModal = true;
  if (v.type === "embed") {
    openModal(displayName(name), '<div class="vid"><iframe src="' + embedUrl(v) + '" title="Demo video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>' +
      '<p class="small">' + esc(v.by) + (v.alt ? ' · shows the whole warm-up' : '') + '</p><div class="row"><a class="btn ghost" href="' + watchUrl(v) + '" target="_blank" rel="noopener">Open on YouTube</a>' +
      (v.alt ? '<a class="btn ghost" href="' + v.alt.url + '" target="_blank" rel="noopener">Find a video for this drill</a>' : '') + '</div>');
  } else {
    openModal(displayName(name), '<p class="cue">No hand-picked video for this drill yet. Open a YouTube search for it:</p><div class="row"><a class="btn" href="' + v.url + '" target="_blank" rel="noopener">Search YouTube: “' + esc(v.q) + '”</a></div><p class="small">Pick a short video from a coach or trainer. The animation shows the key positions.</p>');
  }
}

/* ---------------- routing: sign-in → player card → app ---------------- */
function showGate(text, err, signedIn) {
  $("gate").hidden = false; $("app").hidden = true; $("onboard").hidden = true;
  $("onboard").querySelector(".pform-host").innerHTML = "";
  $("gate-text").textContent = text;
  $("gate-err").textContent = err || "";
  $("signin").hidden = !!signedIn;
  $("gate-signout").hidden = !signedIn;
}
function showApp() {
  $("gate").hidden = true; $("onboard").hidden = true; $("app").hidden = false;
  $("onboard").querySelector(".pform-host").innerHTML = ""; // keep form ids unique while the profile modal is open
  $("demo").hidden = !(state.user && state.user.demo);
  if ($("timer").hidden) render();
}
function route() {
  const u = state.user, p = state.prof;
  if (!u) { showGate("Daily basketball training for ages 10–15. Sign in to start your 67 days."); return; }
  if (p.state === "loading") { showGate("Loading your player card…", "", true); return; }
  if (p.state === "error") { showGate("Couldn't load your player card.", p.message || "", true); return; }
  if (p.state === "none") {
    // Coaches (admins) start in coach view; anyone can choose it on the sign-up screen.
    if (p.viewer || (u.admin && !u.demo && !state.wantCard)) { showApp(); return; }
    showOnboard(); return;
  }
  showApp();
}
$("signin").addEventListener("click", () => { $("gate-err").textContent = ""; store.signIn().catch((e) => { $("gate-err").textContent = e.message; }); });
$("gate-signout").addEventListener("click", () => store.signOutUser());

store.on("user", (u) => { state.user = u; if (!u) { logs = {}; state.prof = { state: "loading" }; } route(); });
store.on("profile", (p) => {
  const was = state.prof.state;
  state.prof = p;
  if (p.state === "ready" && was !== "ready") { state.tab = "today"; state.mapDay = null; state.board.cache = {}; }
  route();
});
store.on("logs", (l) => { logs = l || {}; if (!$("app").hidden && $("timer").hidden) render(); else if (!$("app").hidden && isPlayer()) renderHero(); });
store.on("status", (s) => {
  state.status = s.mode;
  const txt = { demo: "Demo mode", connecting: "Connecting…", synced: s.pending ? "Saving…" : "Synced", offline: "Offline · saved here", error: "Sync problem" }[s.mode];
  if (txt) $("sync").textContent = txt;
  if (s.mode === "error" && s.message && !$("gate").hidden) $("gate-err").textContent = s.message;
});

/* midnight rollover */
let lastDay = tk();
setInterval(() => { const k = tk(); if (k !== lastDay) { lastDay = k; state.makeup = false; if ($("timer").hidden && !$("app").hidden) render(); } }, 60000);

store.start();

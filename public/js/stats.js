// Pure helpers for dates, streaks and the public stats kept on each player card.
// The update rules here mirror the checks in firestore.rules, so keep both in sync.
import { WEEK_MAX } from "./program.js";

export const pad = (n) => String(n).padStart(2, "0");
export const keyOf = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
export const parseKey = (k) => { const a = String(k).split("-"); return new Date(+a[0], +a[1] - 1, +a[2]); };
export const addDays = (d, n) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; };
export const isWeekday = (d) => d.getDay() !== 0 && d.getDay() !== 6;
export const today = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
export const mondayOf = (d) => addDays(d, -((d.getDay() + 6) % 7));
export const mondayKey = (k) => keyOf(mondayOf(parseKey(k)));
export function prevWeekdayKey(k) { let d = addDays(parseKey(k), -1); while (!isWeekday(d)) d = addDays(d, -1); return keyOf(d); }
function nextWeekdayKey(k) { let d = addDays(parseKey(k), 1); while (!isWeekday(d)) d = addDays(d, 1); return keyOf(d); }

const list = (logs) => Object.values(logs || {}).filter(Boolean);
export const doneDates = (logs) => list(logs).filter((l) => l.complete).map((l) => l.date).sort();

// Weekdays in a row with a finished session. Weekends never break it; today doesn't break it until it's over.
export function currentStreak(logs, todayKey) {
  const done = new Set(doneDates(logs));
  let d = parseKey(todayKey), n = 0;
  for (let g = 0; g < 4000; g++) {
    if (isWeekday(d)) { const k = keyOf(d); if (done.has(k)) n++; else if (k !== todayKey) break; }
    d = addDays(d, -1);
  }
  return n;
}
export function longestStreak(logs) {
  const keys = doneDates(logs).filter((k) => isWeekday(parseKey(k)));
  let best = 0, run = 0, prev = null;
  keys.forEach((k) => { run = prev && nextWeekdayKey(prev) === k ? run + 1 : 1; best = Math.max(best, run); prev = k; });
  return best;
}
// Sessions finished before a date: today's session number is this + 1.
export const sessionsBefore = (logs, dateKey) => list(logs).filter((l) => l.complete && l.date < dateKey).length;
// Finished sessions in the same Monday–Sunday week, not counting dateKey itself.
export function weekCount(logs, dateKey) {
  const mk = mondayKey(dateKey);
  return list(logs).filter((l) => l.complete && l.date !== dateKey && l.date >= mk && mondayKey(l.date) === mk).length;
}
export const weekFull = (logs, dateKey) => weekCount(logs, dateKey) >= WEEK_MAX;

// Streak as other players see it: it only stands if the player trained on the last weekday (or today).
export function liveStreak(p, todayKey) {
  if (!p || !p.streak || !p.lastDone) return 0;
  return p.lastDone >= prevWeekdayKey(todayKey) ? p.streak : 0;
}
export const liveWeekXp = (p, todayKey) => (p && p.weekKey === mondayKey(todayKey) ? p.weekXp || 0 : 0);

// New public stats after today's log changes. Returns null when the stored stats are ahead of this
// device's date (clock problem) so nothing inconsistent is written.
export function nextStats(prev, { date, dayXp, dayDone, logsAfter }) {
  if (!prev) return null;
  const last = prev.lastDate || "";
  if (last && last > date) return null;
  const same = last === date;
  const oldDay = same ? prev.dayXp || 0 : 0;
  const xp = Math.max(0, (prev.xp || 0) - oldDay + dayXp);
  const wk = mondayKey(date);
  const weekXp = prev.weekKey === wk ? Math.max(0, (prev.weekXp || 0) - oldDay + dayXp) : dayXp;
  const days = Math.max(0, (prev.days || 0) - (same && prev.dayDone ? 1 : 0) + (dayDone ? 1 : 0));
  const streak = Math.min(days, currentStreak(logsAfter, date));
  const bestStreak = Math.min(days, Math.max(streak, prev.bestStreak || 0, longestStreak(logsAfter)));
  const earlier = doneDates(logsAfter).filter((d) => d < date);
  const lastDone = dayDone ? date : earlier.length ? earlier[earlier.length - 1] : "";
  return { xp, dayXp, dayDone: !!dayDone, lastDate: date, weekXp, weekKey: wk, days, streak, bestStreak, lastDone, updatedAt: Date.now() };
}

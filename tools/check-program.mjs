// Prints block durations for every session and flags anything outside the time budget.
import { sessionFor, PROGRAM_DAYS, HANDLES, allDrillNames } from "../public/js/program.js";

function expand(items) {
  const segs = [];
  items.forEach((it) => {
    for (let k = 1; k <= it.x; k++) {
      (it.L ? ["Left", "Right"] : [null]).forEach(() => segs.push({ secs: it.s, rest: false }));
      if (it.r > 0) segs.push({ secs: it.r, rest: true });
    }
  });
  while (segs.length && segs[segs.length - 1].rest) segs.pop();
  return segs;
}
const secs = (items) => expand(items).reduce((a, s) => a + s.secs, 0);
let bad = 0;
const seen = new Set();
for (const g of ["10-11", "12-15"]) {
  for (let n = 1; n <= PROGRAM_DAYS + 5; n++) {
    const s = sessionFor(g, n);
    const key = g + s.phase.id + s.cycle + s.kind;
    const w = secs(s.warmup), a = secs(s.athletic.items), h = secs(s.handles.items), k = secs(s.skill.items), st = secs(s.strength.items);
    const phys = w + a + st;
    const flags = [];
    if (s.kind === "regular" && (phys > 1260 || phys < 1110)) flags.push("physical " + phys);
    if (k !== 600) flags.push("skill " + k);
    if (h !== 420) flags.push("handles " + h);
    if (!s.skill.items.some((it) => it.t === "challenge" && it.ch === s.ch)) flags.push("no challenge item");
    if (flags.length) bad++;
    if (!seen.has(key) || flags.length) {
      seen.add(key);
      console.log(g, "day", String(n).padStart(2), "P" + s.phase.id, s.cycle, s.kind.padEnd(7), "warm", w, "ath", a, "str", st, "phys", phys, "(" + (phys / 60).toFixed(1) + " min)", "hand", h, "skill", k, flags.length ? " <-- " + flags.join(", ") : "");
    }
  }
}
console.log("drill names:", allDrillNames().length, bad ? "PROBLEMS: " + bad : "all within budget");
process.exitCode = bad ? 1 : 0;

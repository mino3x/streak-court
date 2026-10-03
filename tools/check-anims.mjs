// Lists drill names from the program (and Iron Legs exercises) that have no animation.
import { allDrillNames } from "../public/js/program.js";
import { animFor, ANIMS } from "../public/js/drills.js";
import { EX, VERSIONS } from "../public/js/kokoh-program.js";
const missing = allDrillNames().filter((n) => n !== "Get ready" && !animFor(n) && !animFor(n + " · Left"));
const kokoh = Object.entries(EX).filter(([, e]) => !ANIMS[e.anim]).map(([id, e]) => "Iron Legs: " + id + " → " + e.anim);
Object.values(VERSIONS).forEach((v) => v.blocks.forEach((b) => b.items.forEach((it) => { if (!EX[it.ex]) kokoh.push("Iron Legs " + v.id + ": unknown exercise " + it.ex); })));
const all = missing.concat(kokoh);
console.log(all.length ? "Missing animations:\n  " + all.join("\n  ") : "Every drill has an animation.");
process.exitCode = all.length ? 1 : 0;

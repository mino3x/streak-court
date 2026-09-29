// Lists drill names from the program that have no animation.
import { allDrillNames } from "../public/js/program.js";
import { animFor } from "../public/js/drills.js";
const missing = allDrillNames().filter((n) => n !== "Get ready" && !animFor(n) && !animFor(n + " · Left"));
console.log(missing.length ? "Missing animations:\n  " + missing.join("\n  ") : "Every drill has an animation.");
process.exitCode = missing.length ? 1 : 0;

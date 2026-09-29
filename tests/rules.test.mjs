// Firestore security rules tests. Needs the Firestore emulator:
//   npx firebase-tools emulators:exec --only firestore --project demo-streak-court "node tests/rules.test.mjs"
// Stats updates are produced by the app's own nextStats(), so the app and the rules are tested together.
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, setDoc, updateDoc, getDoc, getDocs, deleteDoc, collection, query, where, orderBy, limit, setLogLevel } from "firebase/firestore";
import { nextStats } from "../public/js/stats.js";

setLogLevel("error");
const env = await initializeTestEnvironment({
  projectId: "demo-streak-court",
  firestore: { rules: readFileSync(new URL("../firestore.rules", import.meta.url), "utf8") }
});

let passed = 0, failed = 0;
async function check(name, fn) {
  try { await fn(); passed++; console.log("ok    " + name); }
  catch (e) {
    failed++;
    const msg = String((e && e.message) || e).split("\n")[0];
    console.log("FAIL  " + name + ": " + msg);
    console.log("::error title=Rules test failed::" + (name + ": " + msg).replace(/%/g, "%25"));
  }
}

const auth = (uid, email, verified = true) => env.authenticatedContext(uid, { email, email_verified: verified }).firestore();
const kid = auth("kid1", "kid1@example.com");
const kid2 = auth("kid2", "kid2@example.com");
const admin = auth("adm1", "henrysastrak@gmail.com");
const unverified = auth("kid3", "kid3@example.com", false);
const anon = env.unauthenticatedContext().firestore();

// Dates as the phone sees them (CI runs in UTC, so local date = UTC date).
const dayKey = (offset) => { const d = new Date(); d.setDate(d.getDate() + offset); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const TODAY = dayKey(0), TOMORROW = dayKey(1);

const card = (over) => Object.assign({ nickname: "Rocket", avatar: "fox", group: "10-11", hidden: false, createdAt: 1, updatedAt: 1,
  xp: 0, dayXp: 0, dayDone: false, lastDate: "", weekXp: 0, weekKey: "", days: 0, streak: 0, bestStreak: 0, lastDone: "" }, over || {});
const log = (uid, date, over) => Object.assign({ uid, date, day: 1, group: "10-11", mode: "full", blocks: { warmup: true },
  score: null, tests: {}, complete: false, xp: 10, parts: { blocks: 10 }, updatedAt: 1 }, over || {});

// ---- player cards ----
await check("kid creates own card", () => assertSucceeds(setDoc(doc(kid, "players/kid1"), card())));
await check("card with XP at creation is refused", () => assertFails(setDoc(doc(kid2, "players/kid2"), card({ xp: 50 }))));
await check("hidden card at creation is refused", () => assertFails(setDoc(doc(kid2, "players/kid2"), card({ hidden: true }))));
await check("bad nickname is refused", () => assertFails(setDoc(doc(kid2, "players/kid2"), card({ nickname: "<b>hi</b>" }))));
await check("unknown avatar is refused", () => assertFails(setDoc(doc(kid2, "players/kid2"), card({ avatar: "cat" }))));
await check("unknown age group is refused", () => assertFails(setDoc(doc(kid2, "players/kid2"), card({ group: "16-18" }))));
await check("extra fields are refused", () => assertFails(setDoc(doc(kid2, "players/kid2"), card({ email: "a@b.c" }))));
await check("card for someone else is refused", () => assertFails(setDoc(doc(kid, "players/kid2"), card())));
await check("unverified email is refused", () => assertFails(setDoc(doc(unverified, "players/kid3"), card())));
await check("signed-out visitor can't make a card", () => assertFails(setDoc(doc(anon, "players/kid3"), card())));
await check("second kid creates a card", () => assertSucceeds(setDoc(doc(kid2, "players/kid2"), card({ nickname: "Mika J", group: "12-15", avatar: "koala" }))));

// ---- private details ----
await check("kid saves private age", () => assertSucceeds(setDoc(doc(kid, "users/kid1"), { age: 11, consent: true, createdAt: 1 })));
await check("age 9 is refused", () => assertFails(setDoc(doc(kid2, "users/kid2"), { age: 9, consent: true, createdAt: 1 })));
await check("age 16 is refused", () => assertFails(setDoc(doc(kid2, "users/kid2"), { age: 16, consent: true, createdAt: 1 })));
await check("no parent OK is refused", () => assertFails(setDoc(doc(kid2, "users/kid2"), { age: 12, consent: false, createdAt: 1 })));
await check("second kid saves private age", () => assertSucceeds(setDoc(doc(kid2, "users/kid2"), { age: 13, consent: true, createdAt: 1 })));
await check("kid updates own age", () => assertSucceeds(updateDoc(doc(kid, "users/kid1"), { age: 12 })));
await check("other kid can't read private age", () => assertFails(getDoc(doc(kid2, "users/kid1"))));
await check("admin can read private age", () => assertSucceeds(getDoc(doc(admin, "users/kid1"))));

// ---- daily logs ----
await check("kid writes today's log", () => assertSucceeds(setDoc(doc(kid, "logs/kid1_" + TODAY), log("kid1", TODAY))));
await check("kid writes tomorrow's log (time zones ahead)", () => assertSucceeds(setDoc(doc(kid, "logs/kid1_" + TOMORROW), log("kid1", TOMORROW))));
await check("log 10 days ago is refused", () => { const d = dayKey(-10); return assertFails(setDoc(doc(kid, "logs/kid1_" + d), log("kid1", d))); });
await check("log 5 days ahead is refused", () => { const d = dayKey(5); return assertFails(setDoc(doc(kid, "logs/kid1_" + d), log("kid1", d))); });
await check("log with 150 XP is refused", () => assertFails(setDoc(doc(kid, "logs/kid1_" + TODAY), log("kid1", TODAY, { xp: 150 }))));
await check("log for another kid is refused", () => assertFails(setDoc(doc(kid, "logs/kid2_" + TODAY), log("kid2", TODAY))));
await check("log id must match uid and date", () => assertFails(setDoc(doc(kid, "logs/kid1_other"), log("kid1", TODAY))));
await check("other kid can't read the log", () => assertFails(getDoc(doc(kid2, "logs/kid1_" + TODAY))));
await check("owner lists own logs", () => assertSucceeds(getDocs(query(collection(kid, "logs"), where("uid", "==", "kid1")))));
await check("other kid can't list someone's logs", () => assertFails(getDocs(query(collection(kid2, "logs"), where("uid", "==", "kid1")))));
await check("admin reads the log", () => assertSucceeds(getDoc(doc(admin, "logs/kid1_" + TODAY))));

// ---- stats: exactly what the app writes ----
let prev = card();
const logs1 = { ["kid1_" + TODAY]: log("kid1", TODAY, { complete: true, xp: 81 }) };
const s1 = nextStats(prev, { date: TODAY, dayXp: 81, dayDone: true, logsAfter: logs1 });
await check("first day stats from the app are accepted", () => assertSucceeds(updateDoc(doc(kid, "players/kid1"), s1)));
prev = Object.assign(card(), s1);
const s2 = nextStats(prev, { date: TODAY, dayXp: 91, dayDone: true, logsAfter: logs1 });
await check("same-day update from the app is accepted", () => assertSucceeds(updateDoc(doc(kid, "players/kid1"), s2)));
prev = Object.assign(prev, s2);
const s3 = nextStats(prev, { date: TODAY, dayXp: 40, dayDone: false, logsAfter: { ["kid1_" + TODAY]: log("kid1", TODAY, { complete: false, xp: 40 }) } });
await check("unticking today from the app is accepted", () => assertSucceeds(updateDoc(doc(kid, "players/kid1"), s3)));
prev = Object.assign(prev, s3);
const s4 = nextStats(prev, { date: TODAY, dayXp: 91, dayDone: true, logsAfter: logs1 });
await check("ticking it again is accepted", () => assertSucceeds(updateDoc(doc(kid, "players/kid1"), s4)));
prev = Object.assign(prev, s4);
await check("XP jump without matching day XP is refused", () => assertFails(updateDoc(doc(kid, "players/kid1"), { xp: prev.xp + 500 })));
await check("day XP over 100 is refused", () => assertFails(updateDoc(doc(kid, "players/kid1"), { xp: prev.xp - prev.dayXp + 150, dayXp: 150, weekXp: prev.weekXp - prev.dayXp + 150 })));
await check("days can't jump by 2", () => assertFails(updateDoc(doc(kid, "players/kid1"), { days: prev.days + 2, bestStreak: prev.bestStreak })));
await check("the same day can't count twice", () => assertFails(updateDoc(doc(kid, "players/kid1"), { days: prev.days + 1 })));
await check("streak can't pass days", () => assertFails(updateDoc(doc(kid, "players/kid1"), { streak: 5, bestStreak: 5 })));
await check("owner can't hide or unhide", () => assertFails(updateDoc(doc(kid, "players/kid1"), { hidden: true })));
await check("a day 4 days ahead is refused", () => {
  const d = dayKey(4), s = nextStats(prev, { date: d, dayXp: 50, dayDone: false, logsAfter: logs1 });
  return assertFails(updateDoc(doc(kid, "players/kid1"), s));
});
await check("going back to an earlier day is refused", () => assertFails(updateDoc(doc(kid, "players/kid1"), { lastDate: dayKey(-1), xp: prev.xp + 10, dayXp: 10, dayDone: false })));
await check("nickname and avatar change keeps stats", () => assertSucceeds(updateDoc(doc(kid, "players/kid1"), { nickname: "Rocket J", avatar: "shark", updatedAt: 2 })));
const logs2 = Object.assign({}, logs1, { ["kid1_" + TOMORROW]: log("kid1", TOMORROW, { complete: true, xp: 70 }) });
const s5 = nextStats(prev, { date: TOMORROW, dayXp: 70, dayDone: true, logsAfter: logs2 });
await check("next day from the app is accepted", () => assertSucceeds(updateDoc(doc(kid, "players/kid1"), s5)));

// ---- leaderboard ----
await check("players read the all-time leaderboard", () => assertSucceeds(getDocs(query(collection(kid2, "players"), orderBy("xp", "desc"), limit(200)))));
await check("players read the weekly leaderboard", () => assertSucceeds(getDocs(query(collection(kid2, "players"), orderBy("weekXp", "desc"), limit(200)))));
await check("signed-out visitors can't read it", () => assertFails(getDocs(query(collection(anon, "players"), orderBy("xp", "desc"), limit(200)))));

// ---- admin ----
await check("admin hides a card", () => assertSucceeds(updateDoc(doc(admin, "players/kid2"), { hidden: true })));
await check("admin can't change XP", () => assertFails(updateDoc(doc(admin, "players/kid2"), { xp: 999 })));
await check("other kid can't change a card", () => assertFails(updateDoc(doc(kid2, "players/kid1"), { nickname: "Hacked" })));
await check("other kid can't delete a card", () => assertFails(deleteDoc(doc(kid2, "players/kid1"))));

// ---- delete my data ----
await check("other kid can't delete someone's log", () => assertFails(deleteDoc(doc(kid2, "logs/kid1_" + TODAY))));
await check("kid deletes own logs", async () => { await assertSucceeds(deleteDoc(doc(kid, "logs/kid1_" + TODAY))); await assertSucceeds(deleteDoc(doc(kid, "logs/kid1_" + TOMORROW))); });
await check("kid deletes own card and details", async () => { await assertSucceeds(deleteDoc(doc(kid, "players/kid1"))); await assertSucceeds(deleteDoc(doc(kid, "users/kid1"))); });
await check("admin deletes a card", () => assertSucceeds(deleteDoc(doc(admin, "players/kid2"))));

// ---- everything else ----
await check("unknown collections are closed", () => assertFails(setDoc(doc(kid, "members/kid1"), { a: 1 })));

await env.cleanup();
console.log("\n" + passed + " passed, " + failed + " failed");
console.log("::notice title=Rules tests::" + passed + " passed, " + failed + " failed");
if (failed) console.log("::error title=Rules tests::" + failed + " rules test(s) failed");
process.exit(failed ? 1 : 0);

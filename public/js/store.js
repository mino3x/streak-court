// Data layer: Google sign-in, player profiles, daily logs and the leaderboard (Firestore, with offline cache).
// If firebase-config.js still has placeholders, runs in "demo mode" and keeps everything on this device.
import {
  initializeApp, getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
  onAuthStateChanged, signOut, setPersistence, browserLocalPersistence,
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, getDocs, setDoc, updateDoc, onSnapshot, query, where, orderBy, limit, writeBatch
} from "./vendor/firebase.bundle.js";
import { firebaseConfig } from "./firebase-config.js";
import { ADMIN_EMAILS } from "./access.js";
import { keyOf, today, mondayKey, newCard, privateDetails } from "./stats.js";

export const configured = !String(firebaseConfig.apiKey || "").startsWith("REPLACE");

const listeners = { user: [], profile: [], logs: [], status: [] };
export function on(evt, fn) { listeners[evt].push(fn); }
function emit(evt, v) { listeners[evt].forEach((f) => { try { f(v); } catch (e) { console.error(e); } }); }

let auth = null, db = null, me = null;
let unsubs = [];
const cache = { pub: undefined, priv: undefined, logs: {}, logsReady: false };
function clearSubs() { unsubs.forEach((u) => { try { u(); } catch (e) { /* ignore */ } }); unsubs = []; }

function lsGet(k, fb) { try { const v = localStorage.getItem(k); return v === null ? fb : JSON.parse(v); } catch (e) { return fb; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }

export const logsReady = () => cache.logsReady;
export const currentPublic = () => cache.pub || null;

function authMessage(e) {
  const c = (e && e.code) || "";
  if (c === "auth/unauthorized-domain") return "This web address isn't allowed yet. In Firebase → Authentication → Settings → Authorized domains, add it.";
  if (c === "auth/network-request-failed") return "No internet connection. Try again when you're online.";
  if (c === "auth/operation-not-allowed") return "Google sign-in isn't turned on yet in Firebase → Authentication.";
  return "Sign-in didn't work (" + (c || "unknown error") + "). Try again.";
}

function emitProfile() {
  if (cache.pub === undefined || cache.priv === undefined) { emit("profile", { state: "loading" }); return; }
  if (!cache.pub) { emit("profile", { state: "none", viewer: isViewer() }); return; }
  emit("profile", { state: "ready", pub: cache.pub, priv: cache.priv || {} });
}

/* ---------------- viewer mode (parents / coaches without a player card) ---------------- */
const viewerKey = () => "sc.viewer." + (me ? me.uid : "x");
export function isViewer() { return !!lsGet(viewerKey(), false); }
export function setViewer(on) { if (on) lsSet(viewerKey(), true); else lsDel(viewerKey()); emitProfile(); }

/* ---------------- demo mode ---------------- */
const DEMO_BOARD = [
  { uid: "s1", nickname: "Sample Rocket", avatar: "eagle", group: "12-15", xp: 2140, weekXp: 310, days: 27, streak: 6, bestStreak: 11 },
  { uid: "s2", nickname: "Sample Mika", avatar: "koala", group: "10-11", xp: 1880, weekXp: 355, days: 24, streak: 9, bestStreak: 9 },
  { uid: "s3", nickname: "Sample Bima", avatar: "tiger", group: "12-15", xp: 960, weekXp: 120, days: 13, streak: 0, bestStreak: 5 },
  { uid: "s4", nickname: "Sample Lala", avatar: "penguin", group: "10-11", xp: 420, weekXp: 180, days: 6, streak: 3, bestStreak: 3 }
];
function demoStart() {
  me = { demo: true, admin: true, name: "Demo mode", email: "", uid: "demo" };
  emit("status", { mode: "demo" });
  emit("user", me);
  const saved = lsGet("sc.demo.profile", null);
  cache.pub = saved ? saved.pub : null; cache.priv = saved ? saved.priv : null;
  cache.logs = lsGet("sc.demo.logs", {}); cache.logsReady = true;
  emitProfile();
  emit("logs", cache.logs);
}
function demoSaveProfile() { lsSet("sc.demo.profile", cache.pub ? { pub: cache.pub, priv: cache.priv } : null); }

/* ---------------- start ---------------- */
export function start() {
  if (!configured) { demoStart(); return; }
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  setPersistence(auth, browserLocalPersistence).catch(() => {});
  try {
    db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
  } catch (e) {
    db = initializeFirestore(app, {});
  }
  getRedirectResult(auth).catch((e) => emit("status", { mode: "error", message: authMessage(e) }));
  onAuthStateChanged(auth, (u) => {
    clearSubs();
    cache.pub = undefined; cache.priv = undefined; cache.logs = {}; cache.logsReady = false;
    if (!u) { me = null; emit("user", null); return; }
    const email = (u.email || "").toLowerCase();
    me = { name: u.displayName || u.email, email: u.email, uid: u.uid, admin: ADMIN_EMAILS.includes(email) };
    emit("user", me);
    emitProfile();
    emit("status", { mode: "connecting" });
    unsubs.push(onSnapshot(doc(db, "players", u.uid), { includeMetadataChanges: true }, (snap) => {
      cache.pub = snap.exists() ? Object.assign({ uid: u.uid }, snap.data()) : null;
      emitProfile();
      emit("status", { mode: snap.metadata.fromCache ? "offline" : "synced", pending: snap.metadata.hasPendingWrites });
    }, (err) => { emit("status", { mode: "error", message: err.message }); emit("profile", { state: "error", message: err.message }); }));
    unsubs.push(onSnapshot(doc(db, "users", u.uid), (snap) => {
      cache.priv = snap.exists() ? snap.data() : null;
      emitProfile();
    }, (err) => { emit("profile", { state: "error", message: err.message }); }));
    unsubs.push(onSnapshot(query(collection(db, "logs"), where("uid", "==", u.uid)), (snap) => {
      const logs = {};
      snap.forEach((d) => { logs[d.id] = d.data(); });
      cache.logs = logs; cache.logsReady = true;
      emit("logs", logs);
    }, (err) => emit("status", { mode: "error", message: err.message })));
  });
}

export async function signIn() {
  if (!configured) return;
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    const c = e && e.code;
    if (c === "auth/popup-closed-by-user" || c === "auth/cancelled-popup-request") return;
    if (c === "auth/popup-blocked" || c === "auth/operation-not-supported-in-this-environment") return signInWithRedirect(auth, provider);
    throw new Error(authMessage(e));
  }
}
export function signOutUser() {
  if (!configured) return Promise.resolve();
  clearSubs();
  return signOut(auth);
}

/* ---------------- profile ---------------- */
const now = () => Date.now();
export async function createProfile({ nickname, age, avatar, group }) {
  const pub = newCard({ nickname, avatar, group }, now());
  const priv = privateDetails(age, now());
  if (!configured) {
    cache.pub = Object.assign({ uid: "demo" }, pub); cache.priv = priv; demoSaveProfile(); setViewer(false); emitProfile(); return;
  }
  const b = writeBatch(db);
  b.set(doc(db, "players", me.uid), pub);
  b.set(doc(db, "users", me.uid), priv);
  lsDel(viewerKey());
  await b.commit();
}

export async function updateProfile({ nickname, age, avatar, group }) {
  if (!configured) {
    Object.assign(cache.pub, { nickname, avatar, group, updatedAt: now() }); cache.priv = Object.assign({}, cache.priv, { age });
    demoSaveProfile(); emitProfile(); return;
  }
  const b = writeBatch(db);
  b.update(doc(db, "players", me.uid), { nickname, avatar, group, updatedAt: now() });
  b.update(doc(db, "users", me.uid), { age });
  await b.commit();
}

/* ---------------- daily log + public stats (one atomic write) ---------------- */
export function saveDay(log, stats) {
  const id = log.uid + "_" + log.date;
  if (!configured) {
    cache.logs = Object.assign({}, cache.logs, { [id]: log }); lsSet("sc.demo.logs", cache.logs);
    if (stats) { Object.assign(cache.pub, stats); demoSaveProfile(); }
    emit("logs", cache.logs); if (stats) emitProfile();
    return Promise.resolve();
  }
  // Two separate writes: the log always saves, even if the public stats are refused.
  if (stats) updateDoc(doc(db, "players", me.uid), stats).catch((e) => console.warn("stats not saved", e));
  return setDoc(doc(db, "logs", id), log);
}

/* ---------------- weekly bonus (fields on the player card) ---------------- */
export function saveBonus(patch) {
  if (!configured) { Object.assign(cache.pub, patch); demoSaveProfile(); emitProfile(); return Promise.resolve(); }
  return updateDoc(doc(db, "players", me.uid), patch);
}

/* ---------------- leaderboard ---------------- */
export async function fetchBoard(kind) {
  if (!configured) {
    const k = keyOf(today());
    const list = DEMO_BOARD.map((p) => Object.assign({ weekKey: mondayKey(k), lastDone: k }, p));
    if (cache.pub) list.push(Object.assign({}, cache.pub, { uid: "demo" }));
    return list;
  }
  const field = kind === "week" ? "weekXp" : "xp";
  const snap = await getDocs(query(collection(db, "players"), orderBy(field, "desc"), limit(200)));
  return snap.docs.map((d) => Object.assign({ uid: d.id }, d.data()));
}
export function setHidden(uid, hidden) {
  if (!configured) return Promise.resolve();
  return updateDoc(doc(db, "players", uid), { hidden: !!hidden });
}

/* ---------------- delete everything for this account ---------------- */
export async function deleteMyData() {
  if (!configured) {
    lsDel("sc.demo.profile"); lsDel("sc.demo.logs");
    cache.pub = null; cache.priv = null; cache.logs = {}; emit("logs", {}); emitProfile(); return;
  }
  const ids = Object.keys(cache.logs);
  for (let i = 0; i < ids.length; i += 400) {
    const b = writeBatch(db);
    ids.slice(i, i + 400).forEach((id) => b.delete(doc(db, "logs", id)));
    await b.commit();
  }
  const b = writeBatch(db);
  b.delete(doc(db, "players", me.uid));
  b.delete(doc(db, "users", me.uid));
  await b.commit();
}

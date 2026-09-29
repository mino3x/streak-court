// Data layer: Google sign-in + Firestore (with offline cache) + family access approvals.
// If firebase-config.js still has placeholders, runs in "demo mode" and keeps data on this device.
import {
  initializeApp, getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
  onAuthStateChanged, signOut, setPersistence, browserLocalPersistence,
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot
} from "./vendor/firebase.bundle.js";
import { firebaseConfig } from "./firebase-config.js";
import { ADMIN_EMAILS } from "./access.js";

export const configured = !String(firebaseConfig.apiKey || "").startsWith("REPLACE");

const listeners = { user: [], logs: [], status: [], access: [], members: [] };
export function on(evt, fn) { listeners[evt].push(fn); }
function emit(evt, v) { listeners[evt].forEach((f) => { try { f(v); } catch (e) { console.error(e); } }); }

let auth = null, db = null, currentUser = null;
let unsubs = [];
function clearSubs() { unsubs.forEach((u) => { try { u(); } catch (e) { /* ignore */ } }); unsubs = []; }

function lsGet(k, fb) { try { const v = localStorage.getItem(k); return v === null ? fb : JSON.parse(v); } catch (e) { return fb; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }

function authMessage(e) {
  const c = (e && e.code) || "";
  if (c === "auth/unauthorized-domain") return "This web address isn't allowed yet. In Firebase → Authentication → Settings → Authorized domains, add it.";
  if (c === "auth/network-request-failed") return "No internet connection. Try again when you're online.";
  if (c === "auth/operation-not-allowed") return "Google sign-in isn't turned on yet in Firebase → Authentication.";
  return "Sign-in didn't work (" + (c || "unknown error") + "). Try again.";
}

function watchLogs() {
  emit("status", { mode: "connecting" });
  unsubs.push(onSnapshot(collection(db, "logs"), { includeMetadataChanges: true }, (snap) => {
    const logs = {};
    snap.forEach((d) => { logs[d.id] = d.data(); });
    emit("logs", logs);
    emit("status", { mode: snap.metadata.fromCache ? "offline" : "synced", pending: snap.metadata.hasPendingWrites });
  }, (err) => {
    emit("status", { mode: err.code === "permission-denied" ? "denied" : "error", message: err.message });
  }));
}

export function start() {
  if (!configured) {
    emit("status", { mode: "demo" });
    currentUser = { demo: true, admin: true, name: "Demo mode", email: "", uid: "demo" };
    emit("user", currentUser);
    emit("access", { state: "approved", player: null });
    emit("logs", lsGet("sc.demo.logs", {}));
    emit("members", []);
    return;
  }
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
    if (!u) { currentUser = null; emit("user", null); emit("logs", {}); return; }
    const email = (u.email || "").toLowerCase();
    const admin = ADMIN_EMAILS.includes(email);
    currentUser = { name: u.displayName || u.email, email: u.email, uid: u.uid, photo: u.photoURL, admin };
    emit("user", currentUser);
    if (admin) {
      emit("access", { state: "approved", player: null });
      watchLogs();
      unsubs.push(onSnapshot(collection(db, "members"), (snap) => {
        const list = [];
        snap.forEach((d) => list.push(Object.assign({ uid: d.id }, d.data())));
        emit("members", list);
      }, () => emit("members", [])));
      return;
    }
    // Family member: own access doc decides what they can see.
    let logsOn = false, filing = false;
    emit("access", { state: "checking" });
    unsubs.push(onSnapshot(doc(db, "members", u.uid), (snap) => {
      if (!snap.exists()) {
        if (filing) return;
        filing = true;
        setDoc(doc(db, "members", u.uid), { email: u.email || "", name: u.displayName || "", approved: false, player: null, requestedAt: Date.now() })
          .catch((e) => emit("status", { mode: "error", message: e.message }));
        emit("access", { state: "pending" });
        return;
      }
      const m = snap.data();
      if (m.approved) {
        emit("access", { state: "approved", player: m.player || null });
        if (!logsOn) { logsOn = true; watchLogs(); }
      } else {
        emit("access", { state: "pending" });
      }
    }, (err) => emit("access", { state: "error", message: err.message })));
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

export function approveMember(uid, player) {
  if (!configured) return Promise.resolve();
  return updateDoc(doc(db, "members", uid), { approved: true, player: player || null });
}
export function removeMember(uid) {
  if (!configured) return Promise.resolve();
  return deleteDoc(doc(db, "members", uid));
}

export function saveLog(log) {
  const id = log.player + "_" + log.date;
  const clean = {
    player: log.player, date: log.date, mode: log.mode, blocks: log.blocks || {},
    score: log.score || null, tests: log.tests || {}, complete: !!log.complete,
    updatedAt: Date.now(), updatedBy: currentUser ? currentUser.uid : ""
  };
  if (!configured) {
    const all = lsGet("sc.demo.logs", {});
    all[id] = clean; lsSet("sc.demo.logs", all);
    emit("logs", all);
    return Promise.resolve();
  }
  return setDoc(doc(db, "logs", id), clean);
}

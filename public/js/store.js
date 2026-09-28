// Data layer: Google sign-in + Firestore (with offline cache).
// If firebase-config.js still has placeholders, runs in "demo mode" and keeps data on this device.
import {
  initializeApp, getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
  onAuthStateChanged, signOut, setPersistence, browserLocalPersistence,
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, doc, setDoc, onSnapshot
} from "./vendor/firebase.bundle.js";
import { firebaseConfig } from "./firebase-config.js";

export const configured = !String(firebaseConfig.apiKey || "").startsWith("REPLACE");

const listeners = { user: [], logs: [], status: [] };
export function on(evt, fn) { listeners[evt].push(fn); }
function emit(evt, v) { listeners[evt].forEach((f) => { try { f(v); } catch (e) { console.error(e); } }); }

let auth = null, db = null, unsub = null, currentUser = null;

function lsGet(k, fb) { try { const v = localStorage.getItem(k); return v === null ? fb : JSON.parse(v); } catch (e) { return fb; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }

function authMessage(e) {
  const c = (e && e.code) || "";
  if (c === "auth/unauthorized-domain") return "This web address isn't allowed yet. In Firebase → Authentication → Settings → Authorized domains, add it.";
  if (c === "auth/network-request-failed") return "No internet connection. Try again when you're online.";
  if (c === "auth/operation-not-allowed") return "Google sign-in isn't turned on yet in Firebase → Authentication.";
  return "Sign-in didn't work (" + (c || "unknown error") + "). Try again.";
}

export function start() {
  if (!configured) {
    emit("status", { mode: "demo" });
    currentUser = { demo: true, name: "Demo mode", email: "", uid: "demo" };
    emit("user", currentUser);
    emit("logs", lsGet("sc.demo.logs", {}));
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
    if (unsub) { unsub(); unsub = null; }
    if (!u) { currentUser = null; emit("user", null); emit("logs", {}); return; }
    currentUser = { name: u.displayName || u.email, email: u.email, uid: u.uid, photo: u.photoURL };
    emit("user", currentUser);
    emit("status", { mode: "connecting" });
    unsub = onSnapshot(collection(db, "logs"), { includeMetadataChanges: true }, (snap) => {
      const logs = {};
      snap.forEach((d) => { logs[d.id] = d.data(); });
      emit("logs", logs);
      emit("status", { mode: snap.metadata.fromCache ? "offline" : "synced", pending: snap.metadata.hasPendingWrites });
    }, (err) => {
      emit("status", { mode: err.code === "permission-denied" ? "denied" : "error", message: err.message });
    });
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
  return signOut(auth);
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

/*
 * Edutech Technology — all Firebase client setup in this one file.
 * 1) Create a Firebase project.
 * 2) Register a Web App and paste its config below.
 * 3) Enable Authentication > Email/Password.
 * 4) Create a Cloud Firestore database.
 *
 * Firebase web config is not a server secret. Protect data with Firestore Rules.
 * Never place service-account keys or private server credentials in this file.
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore, collection, addDoc, getDocs, query, orderBy, limit,
  serverTimestamp, doc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "PASTE_FIREBASE_WEB_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "PASTE_MESSAGING_SENDER_ID",
  appId: "PASTE_FIREBASE_APP_ID"
};

const isConfigured = !Object.values(firebaseConfig).some(value =>
  String(value).startsWith("PASTE_") || String(value).includes("YOUR_PROJECT_ID")
);

let app = null;
let auth = null;
let db = null;

if (isConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export function firebaseReady() { return Boolean(isConfigured && auth && db); }
export function watchAuth(callback) {
  if (!firebaseReady()) { callback(null); return () => {}; }
  return onAuthStateChanged(auth, callback);
}
export async function adminSignIn(email, password) {
  if (!firebaseReady()) throw new Error("Firebase config is missing. Complete firebase.js setup first.");
  return signInWithEmailAndPassword(auth, email, password);
}
export async function adminSignOut() {
  if (auth) await signOut(auth);
}
export function currentUser() { return auth?.currentUser ?? null; }

export async function getPublicNotices() {
  if (!firebaseReady()) return [];
  const noticesQuery = query(collection(db, "notices"), orderBy("createdAt", "desc"), limit(12));
  const snapshot = await getDocs(noticesQuery);
  return snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
}
export async function publishNotice({ title, body, category = "GENERAL", link = "" }) {
  if (!firebaseReady() || !currentUser()) throw new Error("Sign in with an authorized admin account first.");
  return addDoc(collection(db, "notices"), {
    title: String(title).trim(),
    body: String(body).trim(),
    category: String(category).trim().toUpperCase(),
    link: String(link).trim(),
    createdAt: serverTimestamp(),
    createdBy: currentUser().uid
  });
}
export async function removeNotice(noticeId) {
  if (!firebaseReady() || !currentUser()) throw new Error("Sign in with an authorized admin account first.");
  return deleteDoc(doc(db, "notices", noticeId));
}

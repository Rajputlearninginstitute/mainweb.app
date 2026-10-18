import {
  firebaseReady, watchAuth, adminSignIn, adminSignOut, currentUser,
  getPublicNotices, publishNotice, removeNotice
} from "./firebase.js";

const $ = selector => document.querySelector(selector);
const authMessage = $("#authMessage");
const publishMessage = $("#publishMessage");
const loginForm = $("#loginForm");
const noticeForm = $("#noticeForm");
const publishButton = $("#publishButton");
const signOutButton = $("#signOutButton");
const list = $("#adminNoticeList");

function showMessage(element, message, kind = "") {
  element.textContent = message;
  element.className = "admin-message" + (kind ? " " + kind : "");
}
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));

if (!firebaseReady()) {
  showMessage(authMessage, "Firebase is not configured. Open firebase.js and paste your Firebase Web App config.");
} else {
  showMessage(authMessage, "Firebase is configured. Sign in with an authorized admin account.");
}

watchAuth(user => {
  const signedIn = Boolean(user);
  signOutButton.classList.toggle("hidden", !signedIn);
  publishButton.disabled = !signedIn;
  $("#email").disabled = signedIn;
  $("#password").disabled = signedIn;
  loginForm.querySelector('button[type="submit"]').classList.toggle("hidden", signedIn);
  showMessage(authMessage, signedIn ? `Signed in as ${user.email || user.uid}. If you are not authorized, Firestore Rules will reject publishing.` : (firebaseReady() ? "Sign in with an authorized Firebase admin account." : "Firebase setup is required before sign-in will work."), signedIn ? "success" : "");
  if (signedIn) loadAdminNotices();
  else list.innerHTML = '<div class="admin-message">Sign in to view notices.</div>';
});

loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  try {
    await adminSignIn($("#email").value.trim(), $("#password").value);
    showMessage(authMessage, "Signed in. Loading admin content…", "success");
  } catch (error) {
    showMessage(authMessage, error.message || "Sign-in failed. Check credentials and Firebase setup.", "error");
  }
});
signOutButton.addEventListener("click", async () => {
  try { await adminSignOut(); showMessage(authMessage, "Signed out successfully."); }
  catch (error) { showMessage(authMessage, error.message || "Could not sign out.", "error"); }
});

noticeForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (!currentUser()) return showMessage(publishMessage, "Please sign in first.", "error");
  const title = $("#noticeTitle").value.trim();
  const body = $("#noticeBody").value.trim();
  const link = $("#noticeLink").value.trim();
  if (link && !/^https?:\/\//i.test(link)) return showMessage(publishMessage, "Link must begin with http:// or https://.", "error");
  publishButton.disabled = true;
  try {
    await publishNotice({ title, body, category: $("#category").value, link });
    noticeForm.reset();
    showMessage(publishMessage, "Notice published successfully.", "success");
    await loadAdminNotices();
  } catch (error) {
    showMessage(publishMessage, error.message || "Could not publish. Check Firestore Rules and admin authorization.", "error");
  } finally {
    publishButton.disabled = !currentUser();
  }
});

$("#refreshButton").addEventListener("click", loadAdminNotices);

async function loadAdminNotices() {
  if (!currentUser()) return;
  list.innerHTML = '<div class="admin-message">Loading notices…</div>';
  try {
    const notices = await getPublicNotices();
    if (!notices.length) {
      list.innerHTML = '<div class="admin-message">No notices found.</div>';
      return;
    }
    list.innerHTML = notices.map(item => `
      <article class="admin-notice">
        <div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.body)}</p><small>${escapeHtml(item.category || "GENERAL")}</small></div>
        <button type="button" data-delete="${escapeHtml(item.id)}">Delete</button>
      </article>`).join("");
    list.querySelectorAll("[data-delete]").forEach(button => button.addEventListener("click", async () => {
      if (!confirm("Delete this notice from the public homepage?")) return;
      button.disabled = true;
      try { await removeNotice(button.dataset.delete); await loadAdminNotices(); }
      catch (error) { showMessage(publishMessage, error.message || "Delete failed. Check admin permissions.", "error"); button.disabled = false; }
    }));
  } catch (error) {
    list.innerHTML = '<div class="admin-message error">Could not load notices. Check Firestore Rules and Firebase configuration.</div>';
    console.error(error);
  }
}

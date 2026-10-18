import { SITE_CONFIG } from "./config.js";
import { firebaseReady, getPublicNotices } from "./firebase.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

$("#year").textContent = new Date().getFullYear();

const menuToggle = $("#menuToggle");
const mainNav = $("#mainNav");
menuToggle?.addEventListener("click", () => {
  const open = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
});
mainNav?.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
  mainNav.classList.remove("open");
  menuToggle?.setAttribute("aria-expanded", "false");
}));

// Filter cards by class and search term.
let selectedClass = "all";
const searchInput = $("#resourceSearch");
function filterResources() {
  const search = (searchInput?.value || "").trim().toLowerCase();
  $$(".resource-card").forEach(card => {
    const classes = (card.dataset.class || "").split(",");
    const text = (card.dataset.search + " " + card.textContent).toLowerCase();
    const classMatch = selectedClass === "all" || classes.includes(selectedClass);
    card.hidden = !(classMatch && text.includes(search));
  });
}
$$(".filter-btn").forEach(button => button.addEventListener("click", () => {
  selectedClass = button.dataset.class;
  $$(".filter-btn").forEach(item => item.classList.toggle("active", item === button));
  filterResources();
}));
searchInput?.addEventListener("input", filterResources);

// Set configured portal links. If not set, leave safe in-page fallbacks and show a hint.
function setPortalLink(id, url, fallback) {
  const element = document.getElementById(id);
  if (!element) return;
  if (url && /^https?:\/\//i.test(url)) {
    element.href = url;
    element.target = "_blank";
    element.rel = "noopener";
  } else {
    element.href = fallback || "#portals";
    element.removeAttribute("target");
    element.removeAttribute("rel");
    element.addEventListener("click", event => {
      if (!url) {
        event.preventDefault();
        alert("Portal link abhi configure nahi hai. config.js mein apna verified URL add karo.");
      }
    });
  }
}
setPortalLink("resultsLink", SITE_CONFIG.resultsPortalUrl, "#portals");
setPortalLink("resultsPortalCard", SITE_CONFIG.resultsPortalUrl, "#results");
setPortalLink("supportPortalLink", SITE_CONFIG.supportPortalUrl, "#resources");
setPortalLink("officialPortalLink", SITE_CONFIG.officialPortalUrl, "#notices");
if (SITE_CONFIG.resultsPortalUrl) $("#resultsHint").textContent = "Use the authorized portal and follow its verification steps.";

// Load public notices from Firestore once configured.
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));
function formatDate(value) {
  const date = value?.toDate ? value.toDate() : null;
  if (!date) return "NEW";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(date).toUpperCase();
}
async function loadNotices() {
  if (!firebaseReady()) return;
  const list = $("#noticeList");
  const status = $("#noticeStatus");
  try {
    const notices = await getPublicNotices();
    if (!notices.length) {
      status.textContent = "No live notices published yet.";
      return;
    }
    list.innerHTML = notices.map(notice => `
      <article class="notice-item">
        <div class="notice-date"><strong>${escapeHtml(formatDate(notice.createdAt))}</strong><span>${escapeHtml(notice.category || "UPDATE")}</span></div>
        <div class="notice-content"><span class="notice-tag">${escapeHtml(notice.category || "UPDATE")}</span>
          <h3>${escapeHtml(notice.title)}</h3><p>${escapeHtml(notice.body)}</p>
          ${notice.link && /^https?:\/\//i.test(notice.link) ? `<a class="text-link" href="${escapeHtml(notice.link)}" target="_blank" rel="noopener">Open notice link ↗</a>` : ""}
        </div><span class="notice-arrow">↗</span>
      </article>`).join("") + '<div class="notice-status" id="noticeStatus">Live notices loaded.</div>';
  } catch (error) {
    status.textContent = "Live notices couldn't load. Check Firebase setup and Firestore Rules.";
    console.error(error);
  }
}
loadNotices();

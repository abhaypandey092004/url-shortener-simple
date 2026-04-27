/**
 * URL Shortener Dashboard - Client Logic (Production Ready)
 */

// Configuration - Fallbacks to localhost for development
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? "http://localhost:5000/api" 
  : "/api"; // In production, assume same origin or relative path

const SHORT_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? "http://localhost:5000"
  : window.location.origin;

let charts = {};
let allUrls = [];

/**
 * Utility: Safe Text Helper (Prevents XSS)
 */
function safeText(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Utility: Toast Notifications
 */
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(20px)";
    toast.style.transition = "0.25s ease";
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

/**
 * Utility: Number Animation
 */
function animateValue(element, start, end, duration) {
  if (!element) return;
  const isFloat = String(end).includes(".");
  let startTime = null;

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const current = progress * (end - start) + start;
    element.textContent = isFloat ? current.toFixed(2) : Math.floor(current);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/**
 * Navigation Logic
 */
function showSection(sectionId, clickedButton) {
  document.querySelectorAll(".content-section").forEach((s) => s.classList.remove("active-section"));
  const target = document.getElementById(sectionId);
  if (target) target.classList.add("active-section");

  document.querySelectorAll(".nav-item").forEach((i) => i.classList.remove("active"));
  if (clickedButton) clickedButton.classList.add("active");

  // Load section-specific data
  if (sectionId === "dashboard") loadStats();
  if (sectionId === "links") loadUrls();
  if (sectionId === "analytics") {
    loadStats();
    loadAnalytics();
    loadTopLinks();
  }
}

function goToSection(sectionId, navIndex) {
  const navItems = document.querySelectorAll(".nav-item");
  showSection(sectionId, navItems[navIndex]);
}

function toggleAuthPopup() {
  document.getElementById("authPopup").classList.toggle("hidden");
}

/**
 * Auth Logic
 */
function getToken() { return localStorage.getItem("token"); }
function getCurrentUser() {
  const stored = localStorage.getItem("user");
  return stored ? JSON.parse(stored) : null;
}

function setCurrentUser(user, token) {
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("token", token);
  updateAuthUI();
}

function clearCurrentUser() {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  updateAuthUI();
}

function authHeaders() {
  const token = getToken();
  return { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };
}

function updateAuthUI() {
  const user = getCurrentUser();
  const sidebarUser = document.getElementById("sidebarUser");
  const currentUserText = document.getElementById("currentUserText");

  if (user) {
    sidebarUser.textContent = user.name;
    currentUserText.textContent = `Logged in as ${user.name} (${user.email})`;
  } else {
    sidebarUser.textContent = "Not logged in";
    currentUserText.textContent = "Please login to access your dashboard";
  }
}

async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      const wasLoggedIn = !!getToken();
      clearCurrentUser();
      if (wasLoggedIn) {
        showToast("Session expired, please login again.", "error");
        setTimeout(() => window.location.reload(), 2000);
      }
    }
    throw new Error(data.error || "Something went wrong");
  }
  return data;
}

async function loginUser() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const data = await handleResponse(await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    }));
    setCurrentUser(data.user, data.token);
    showToast("Welcome back!", "success");
    toggleAuthPopup();
    initDashboard();
  } catch (e) { showToast(e.message, "error"); }
}

async function signupUser() {
  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  try {
    const data = await handleResponse(await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    }));
    setCurrentUser(data.user, data.token);
    showToast("Account created!", "success");
    toggleAuthPopup();
    initDashboard();
  } catch (e) { showToast(e.message, "error"); }
}

function logoutUser() {
  clearCurrentUser();
  window.location.reload();
}

/**
 * URL Logic
 */
async function shortenUrl() {
  if (!getToken()) return showToast("Login required", "error");
  
  const originalUrl = document.getElementById("originalUrl").value;
  const customCode = document.getElementById("customCode").value.toLowerCase();
  const expiresAt = document.getElementById("expiresAt").value;

  try {
    const data = await handleResponse(await fetch(`${API_BASE}/urls/shorten`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ originalUrl, customCode, expiresAt })
    }));

    showToast("URL Shortened!", "success");
    const resultBox = document.getElementById("result");
    resultBox.innerHTML = `
      <div class="message-success">
        <p>Short URL: <a href="${safeText(data.shortUrl)}" target="_blank">${safeText(data.shortUrl)}</a></p>
      </div>
    `;

    document.getElementById("qrBox").innerHTML = `
      <div class="qr-container">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(data.shortUrl)}" />
        <div class="actions">
          <button class="btn btn-secondary btn-small" onclick="copyToClipboard('${safeText(data.shortUrl)}')">Copy</button>
          <button class="btn btn-primary btn-small" onclick="shareLink('${safeText(data.shortUrl)}')">Share</button>
        </div>
      </div>
    `;
    loadUrls();
    loadStats();
  } catch (e) { showToast(e.message, "error"); }
}

async function loadStats() {
  if (!getToken()) return;
  try {
    const data = await handleResponse(await fetch(`${API_BASE}/analytics/summary`, { headers: authHeaders() }));
    const box = document.getElementById("statsBox");
    const abox = document.getElementById("analyticsStatsBox");

    const html = `
      <div class="stat-card"><h4>Total Links</h4><p id="s-total">0</p></div>
      <div class="stat-card"><h4>Total Clicks</h4><p id="s-clicks">0</p></div>
      <div class="stat-card"><h4>Avg Clicks</h4><p id="s-avg">0</p></div>
      <div class="stat-card"><h4>Active Now</h4><p id="s-active">0</p></div>
    `;
    if (box) box.innerHTML = html;
    if (abox) abox.innerHTML = html;

    animateValue(document.getElementById("s-total"), 0, data.totalUrls, 1000);
    animateValue(document.getElementById("s-clicks"), 0, data.totalClicks, 1000);
    animateValue(document.getElementById("s-avg"), 0, data.avgClicksPerUrl, 1000);
    
    // Calculate active count locally
    if (allUrls.length === 0) await loadUrls();
    const active = allUrls.filter(u => !u.expires_at || new Date(u.expires_at) > new Date()).length;
    animateValue(document.getElementById("s-active"), 0, active, 1000);
  } catch (e) { console.error(e); }
}

async function loadUrls() {
  if (!getToken()) return;
  try {
    allUrls = await handleResponse(await fetch(`${API_BASE}/urls`, { headers: authHeaders() }));
    filterUrls();
  } catch (e) { console.error(e); }
}

function filterUrls() {
  const q = document.getElementById("linkSearch")?.value.toLowerCase() || "";
  const status = document.getElementById("statusFilter")?.value || "all";
  const list = document.getElementById("urlList");

  const filtered = allUrls.filter(u => {
    const matchQ = u.short_code.toLowerCase().includes(q) || u.original_url.toLowerCase().includes(q);
    const expired = u.expires_at && new Date(u.expires_at) < new Date();
    const matchStatus = status === "all" || (status === "active" ? !expired : expired);
    return matchQ && matchStatus;
  });

  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state"><p>No links found.</p></div>`;
    return;
  }

  list.innerHTML = filtered.map(u => {
    const expired = u.expires_at && new Date(u.expires_at) < new Date();
    const shortUrl = `${SHORT_BASE}/${u.short_code}`;
    return `
      <div class="list-item">
        <div class="list-item-top">
          <span class="code-badge">${safeText(u.short_code)}</span>
          <span class="click-badge">${u.click_count} Clicks</span>
        </div>
        <p class="truncate"><strong>URL:</strong> <a href="${safeText(u.original_url)}" target="_blank">${safeText(u.original_url)}</a></p>
        <div class="expiry-badge ${expired ? 'expired' : ''}">
          ${expired ? 'Expired' : (u.expires_at ? 'Expires: ' + new Date(u.expires_at).toLocaleDateString() : 'Never Expires')}
        </div>
        <div class="actions">
          <button class="btn btn-secondary btn-small" onclick="copyToClipboard('${safeText(shortUrl)}')">Copy</button>
          <button class="btn btn-secondary btn-small" onclick="shareLink('${safeText(shortUrl)}')">Share</button>
          <button class="btn btn-danger btn-small" onclick="deleteUrl('${safeText(u.short_code)}')">Delete</button>
        </div>
      </div>
    `;
  }).join("");
}

async function deleteUrl(code) {
  if (!confirm(`Delete link '${code}'?`)) return;
  try {
    await handleResponse(await fetch(`${API_BASE}/urls/${code}`, {
      method: "DELETE",
      headers: authHeaders()
    }));
    showToast("Deleted", "success");
    loadUrls();
    loadStats();
  } catch (e) { showToast(e.message, "error"); }
}

/**
 * Analytics Logic
 */
async function loadAnalytics() {
  if (!getToken()) return;
  try {
    const clicks = await handleResponse(await fetch(`${API_BASE}/analytics/clicks-by-date`, { headers: authHeaders() }));
    const breakdown = await handleResponse(await fetch(`${API_BASE}/analytics/breakdown`, { headers: authHeaders() }));
    
    renderChart("clicksChart", "line", clicks.map(c => c.date), clicks.map(c => c.clicks), "Daily Clicks");
    renderChart("deviceChart", "doughnut", breakdown.devices.map(d => d.label), breakdown.devices.map(d => d.value), "Devices");
    renderChart("browserChart", "pie", breakdown.browsers.map(b => b.label), breakdown.browsers.map(b => b.value), "Browsers");
    renderChart("osChart", "polarArea", breakdown.os.map(o => o.label), breakdown.os.map(o => o.value), "Operating Systems");
  } catch (e) { console.error(e); }
}

async function loadTopLinks() {
  if (!getToken()) return;
  try {
    const links = await handleResponse(await fetch(`${API_BASE}/analytics/top-links`, { headers: authHeaders() }));
    const list = document.getElementById("topLinks");
    if (!list) return;

    if (links.length === 0) {
      list.innerHTML = "<p>No data yet.</p>";
      return;
    }

    list.innerHTML = links.map(l => `
      <div class="list-item" style="margin-bottom: 8px;">
        <div class="list-item-top">
          <strong>/${safeText(l.short_code)}</strong>
          <span class="click-badge">${l.click_count} Clicks</span>
        </div>
        <p class="truncate muted" style="font-size: 11px;">${safeText(l.original_url)}</p>
      </div>
    `).join("");
  } catch (e) { console.error(e); }
}

function renderChart(id, type, labels, data, title) {
  const el = document.getElementById(id);
  if (!el) return;
  const ctx = el.getContext("2d");
  if (charts[id]) charts[id].destroy();

  const isDark = !document.body.classList.contains("light");
  const textColor = isDark ? "#94a3b8" : "#475569";
  const colors = ["#6366f1", "#06b6d4", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

  charts[id] = new Chart(ctx, {
    type: type,
    data: {
      labels: labels,
      datasets: [{
        label: title,
        data: data,
        backgroundColor: type === "line" ? "rgba(99, 102, 241, 0.1)" : colors,
        borderColor: "#6366f1",
        borderWidth: 2,
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: type !== "line", labels: { color: textColor } }
      },
      scales: type === "line" ? {
        x: { ticks: { color: textColor } },
        y: { ticks: { color: textColor }, beginAtZero: true }
      } : {}
    }
  });
}

/**
 * Social & Utilities
 */
function shareLink(url) {
  if (navigator.share) {
    navigator.share({ title: 'Short Link', url: url }).catch(() => {});
  } else {
    window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, '_blank');
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => showToast("Copied!", "success"));
}

function exportLinksToCSV() {
  if (allUrls.length === 0) return showToast("Nothing to export", "error");
  
  const headers = ["Short Code", "Original URL", "Clicks", "Expires At"];
  const rows = allUrls.map(u => [u.short_code, u.original_url, u.click_count, u.expires_at || 'Never']);
  const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");

  const link = document.createElement("a");
  link.href = encodeURI(csvContent);
  link.download = "my_links.csv";
  link.click();
}

function toggleTheme() {
  document.body.classList.toggle("light");
  localStorage.setItem("theme", document.body.classList.contains("light") ? "light" : "dark");
  loadAnalytics(); // Refresh charts to update colors
}

/**
 * Initialize Dashboard Data
 */
function initDashboard() {
  loadStats();
  loadUrls();
  if (document.getElementById("analytics").classList.contains("active-section")) {
    loadAnalytics();
    loadTopLinks();
  }
}

/**
 * Initialize
 */
async function init() {
  if (localStorage.getItem("theme") === "light") document.body.classList.add("light");
  
  const token = getToken();
  if (token) {
    try {
      const data = await handleResponse(await fetch(`${API_BASE}/auth/me`, {
        headers: authHeaders()
      }));
      // Update user info in case it changed
      localStorage.setItem("user", JSON.stringify(data.user));
      updateAuthUI();
      initDashboard();
    } catch (e) {
      console.error("Session verification failed:", e.message);
      // handleResponse will handle clearCurrentUser if it was a 401
    }
  } else {
    updateAuthUI();
  }

  // Real-time lowercase transformation for custom code
  const customCodeInput = document.getElementById("customCode");
  if (customCodeInput) {
    customCodeInput.addEventListener("input", (e) => {
      e.target.value = e.target.value.toLowerCase();
    });
  }
}

window.onload = init;
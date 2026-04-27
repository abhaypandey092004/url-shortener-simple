<<<<<<< HEAD
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
=======
const API_BASE = "http://localhost:5000/api";
const SHORT_BASE = "http://localhost:5000";

const URL_REGEX =
  /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,10}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;

let analyticsChart = null;
let analyticsChartSecondary = null;

>>>>>>> 0ca757b01c82d1657c42d8d3dd5af3f9c25d7254
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
<<<<<<< HEAD
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

/**
 * Utility: Number Animation
 */
function animateValue(element, start, end, duration) {
  if (!element) return;
=======
  }, 2600);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function animateValue(element, start, end, duration) {
  if (!element) return;

>>>>>>> 0ca757b01c82d1657c42d8d3dd5af3f9c25d7254
  const isFloat = String(end).includes(".");
  let startTime = null;

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const current = progress * (end - start) + start;
<<<<<<< HEAD
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
=======

    element.textContent = isFloat ? current.toFixed(2) : Math.floor(current);

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

function applyStaggerAnimation(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;

  const items = section.querySelectorAll(".glass-card, .stat-card, .list-item");
  items.forEach((item) => item.classList.remove("animate-in"));

  items.forEach((item, index) => {
    setTimeout(() => {
      item.classList.add("animate-in");
    }, index * 70);
  });
}

function showSection(sectionId, clickedButton) {
  document.querySelectorAll(".content-section").forEach((section) => {
    section.classList.remove("active-section");
  });

  document.getElementById(sectionId).classList.add("active-section");

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.remove("active");
  });

  clickedButton.classList.add("active");

  setTimeout(() => {
    applyStaggerAnimation(sectionId);
  }, 40);
>>>>>>> 0ca757b01c82d1657c42d8d3dd5af3f9c25d7254
}

function goToSection(sectionId, navIndex) {
  const navItems = document.querySelectorAll(".nav-item");
  showSection(sectionId, navItems[navIndex]);
}

function toggleAuthPopup() {
<<<<<<< HEAD
  document.getElementById("authPopup").classList.toggle("hidden");
}

/**
 * Auth Logic
 */
function getToken() { return localStorage.getItem("token"); }
=======
  const popup = document.getElementById("authPopup");
  popup.classList.toggle("hidden");
}

function getToken() {
  return localStorage.getItem("token");
}

>>>>>>> 0ca757b01c82d1657c42d8d3dd5af3f9c25d7254
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
<<<<<<< HEAD
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
=======

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

function setMessage(elementId, message, isError = false, isSuccessBox = false) {
  const element = document.getElementById(elementId);

  if (isSuccessBox) {
    element.className = "message-success";
    element.innerHTML = message;
    return;
  }

  element.className = "message-box";
  element.innerHTML = isError
    ? `<span style="color:#fca5a5;">${message}</span>`
    : message;
}

function updateAuthUI() {
  const currentUser = getCurrentUser();
  const currentUserText = document.getElementById("currentUserText");
  const sidebarUser = document.getElementById("sidebarUser");

  if (currentUser) {
    currentUserText.textContent = `Logged in as ${currentUser.name} (${currentUser.email})`;
    sidebarUser.textContent = currentUser.name;
  } else {
    currentUserText.textContent = "Not logged in";
    sidebarUser.textContent = "Not logged in";
  }
}

async function signupUser() {
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();

  if (!name || !email || !password) {
    setMessage("authStatus", "Please fill all signup fields", true);
    showToast("Please fill all signup fields", "error");
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage("authStatus", data.error || "Signup failed", true);
      showToast(data.error || "Signup failed", "error");
      return;
    }

    setCurrentUser(data.user, data.token);
    setMessage("authStatus", "Signup successful. You are now logged in.", false, true);
    showToast("Signup successful", "success");
    toggleAuthPopup();

    document.getElementById("signupName").value = "";
    document.getElementById("signupEmail").value = "";
    document.getElementById("signupPassword").value = "";

    await loadUsers();
    await loadStats();
    await loadUrls();
  } catch (error) {
    setMessage("authStatus", "Server error during signup", true);
    showToast("Server error during signup", "error");
  }
}

async function loginUser() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (!email || !password) {
    setMessage("authStatus", "Please fill login email and password", true);
    showToast("Please fill login email and password", "error");
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage("authStatus", data.error || "Login failed", true);
      showToast(data.error || "Login failed", "error");
      return;
    }

    setCurrentUser(data.user, data.token);
    setMessage("authStatus", "Login successful.", false, true);
    showToast("Login successful", "success");
    toggleAuthPopup();

    document.getElementById("loginEmail").value = "";
    document.getElementById("loginPassword").value = "";

    await loadUsers();
    await loadUrls();
  } catch (error) {
    setMessage("authStatus", "Server error during login", true);
    showToast("Server error during login", "error");
  }
>>>>>>> 0ca757b01c82d1657c42d8d3dd5af3f9c25d7254
}

function logoutUser() {
  clearCurrentUser();
<<<<<<< HEAD
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
=======
  setMessage("authStatus", "Logged out successfully.", false, true);
  showToast("Logged out successfully", "info");
  toggleAuthPopup();
}

async function loadUsers() {
  try {
    const response = await fetch(`${API_BASE}/users`);
    const users = await response.json();

    const filterUser = document.getElementById("filterUser");
    filterUser.innerHTML = `<option value="">All Users</option>`;

    users.forEach((user) => {
      filterUser.innerHTML += `<option value="${user.id}">${user.name}</option>`;
    });
  } catch (error) {
    console.error("Failed to load users");
  }
}

async function shortenUrl() {
  const token = getToken();

  if (!token) {
    setMessage("result", "Please login first to create a short URL", true);
    showToast("Please login first", "error");
    return;
  }

  const originalUrl = document.getElementById("originalUrl").value.trim();
  const customCode = document.getElementById("customCode").value.trim();
  const expiresAt = document.getElementById("expiresAt").value;

  if (!URL_REGEX.test(originalUrl)) {
    setMessage("result", "Please enter a valid URL starting with http:// or https://", true);
    showToast("Please enter a valid URL", "error");
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/shorten`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        originalUrl,
        customCode,
        expiresAt: expiresAt || null
      })
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage("result", data.error || "Something went wrong", true);
      showToast(data.error || "Something went wrong", "error");
      return;
    }

    setMessage(
      "result",
      `<strong>Short URL created successfully:</strong><br><a href="${data.shortUrl}" target="_blank">${data.shortUrl}</a>`,
      false,
      true
    );

    showToast("Short URL created successfully", "success");

    document.getElementById("originalUrl").value = "";
    document.getElementById("customCode").value = "";
    document.getElementById("expiresAt").value = "";

    document.getElementById("qrBox").innerHTML = `
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(data.shortUrl)}" alt="QR Code">
    `;

    await loadUrls();
    await loadStats();
    await loadTopLinks();
  } catch (error) {
    setMessage("result", "Server error while shortening URL", true);
    showToast("Server error while shortening URL", "error");
  }
}

async function loadStats() {
  try {
    const response = await fetch(`${API_BASE}/stats`);
    const data = await response.json();

    const statsHTML = `
      <div class="stat-card">
        <h4>Total URLs</h4>
        <p id="totalUrlsValue">0</p>
      </div>
      <div class="stat-card">
        <h4>Total Clicks</h4>
        <p id="totalClicksValue">0</p>
      </div>
      <div class="stat-card">
        <h4>Total Users</h4>
        <p id="totalUsersValue">0</p>
      </div>
      <div class="stat-card">
        <h4>Avg Clicks / URL</h4>
        <p id="avgClicksValue">0</p>
      </div>
    `;

    document.getElementById("statsBox").innerHTML = statsHTML;
    document.getElementById("analyticsStatsBox").innerHTML = statsHTML;

    setTimeout(() => {
      animateValue(document.getElementById("totalUrlsValue"), 0, Number(data.totalUrls), 800);
      animateValue(document.getElementById("totalClicksValue"), 0, Number(data.totalClicks), 900);
      animateValue(document.getElementById("totalUsersValue"), 0, Number(data.totalUsers), 800);
      animateValue(document.getElementById("avgClicksValue"), 0, Number(data.avgClicksPerUrl), 1000);
    }, 100);

    renderCharts(data);
  } catch (error) {
    document.getElementById("statsBox").innerHTML = `<p>Failed to load statistics.</p>`;
    document.getElementById("analyticsStatsBox").innerHTML = `<p>Failed to load statistics.</p>`;
    showToast("Failed to load statistics", "error");
  }
}

function chartTextColor() {
  return getComputedStyle(document.body).getPropertyValue("--text").trim() || "#ffffff";
}

function renderCharts(data) {
  const chartData = [data.totalUrls, data.totalClicks, data.totalUsers];
  const labels = ["URLs", "Clicks", "Users"];

  const primaryCtx = document.getElementById("analyticsChart").getContext("2d");
  const secondaryCtx = document.getElementById("analyticsChartSecondary").getContext("2d");

  if (analyticsChart) analyticsChart.destroy();
  if (analyticsChartSecondary) analyticsChartSecondary.destroy();

  analyticsChart = new Chart(primaryCtx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Overview",
          data: chartData
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: chartTextColor()
          }
        }
      },
      scales: {
        x: {
          ticks: { color: chartTextColor() },
          grid: { color: "rgba(148,163,184,0.15)" }
        },
        y: {
          ticks: { color: chartTextColor() },
          grid: { color: "rgba(148,163,184,0.15)" }
        }
      }
    }
  });

  analyticsChartSecondary = new Chart(secondaryCtx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          label: "Overview",
          data: chartData
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: chartTextColor()
          }
        }
      }
>>>>>>> 0ca757b01c82d1657c42d8d3dd5af3f9c25d7254
    }
  });
}

<<<<<<< HEAD
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
=======
async function loadUrls() {
  try {
    const selectedUserId = document.getElementById("filterUser").value;
    const url = selectedUserId
      ? `${API_BASE}/urls?userId=${selectedUserId}`
      : `${API_BASE}/urls`;

    const response = await fetch(url);
    const urls = await response.json();

    const urlList = document.getElementById("urlList");

    if (!urls.length) {
      urlList.innerHTML = `<p>No URLs found.</p>`;
      return;
    }

    urlList.innerHTML = urls
      .map((urlItem) => {
        const expiryText = urlItem.expires_at
          ? `<div class="expiry-badge">Expires: ${new Date(urlItem.expires_at).toLocaleString()}</div>`
          : `<div class="expiry-badge">No Expiry</div>`;

        return `
          <div class="list-item">
            <div class="list-item-top">
              <div class="code-badge">${urlItem.short_code}</div>
              <div class="user-badge">${urlItem.user_name || "No User"}</div>
            </div>

            <p>
              <strong>Original URL:</strong><br>
              <a href="${urlItem.original_url}" target="_blank">${urlItem.original_url}</a>
            </p>

            <p><strong>Clicks:</strong> ${urlItem.click_count}</p>
            ${expiryText}

            <div class="actions">
              <button class="btn btn-secondary btn-small" onclick="copyShortUrl('${urlItem.short_code}')">Copy</button>
              <button class="btn btn-secondary btn-small" onclick="shareUrl('${urlItem.short_code}')">Share</button>
              <button class="btn btn-danger btn-small" onclick="deleteUrl('${urlItem.short_code}')">Delete</button>
            </div>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    document.getElementById("urlList").innerHTML = `<p>Failed to load URLs.</p>`;
    showToast("Failed to load URLs", "error");
  }
}

async function deleteUrl(code) {
  const token = getToken();

  if (!token) {
    showToast("Please login first", "error");
    return;
  }

  const isConfirmed = confirm("Are you sure you want to delete this URL?");
  if (!isConfirmed) return;

  try {
    const response = await fetch(`${API_BASE}/urls/${code}`, {
      method: "DELETE",
      headers: authHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      showToast(data.error || "Delete failed", "error");
      return;
    }

    showToast("URL deleted successfully", "success");

    await loadUrls();
    await loadStats();
    await loadTopLinks();
  } catch (error) {
    showToast("Server error while deleting URL", "error");
  }
}

async function loadTopLinks() {
  try {
    const response = await fetch(`${API_BASE}/top-links`);
    const links = await response.json();

    const topLinks = document.getElementById("topLinks");

    if (!links.length) {
      topLinks.innerHTML = `<p>No top links yet.</p>`;
      return;
    }

    topLinks.innerHTML = links
      .map((link) => {
        return `
          <div class="list-item">
            <div class="list-item-top">
              <div class="code-badge">${link.short_code}</div>
              <div class="user-badge">${link.user_name || "No User"}</div>
            </div>

            <p>
              <strong>Original URL:</strong><br>
              <a href="${link.original_url}" target="_blank">${link.original_url}</a>
            </p>

            <p><strong>Clicks:</strong> ${link.click_count}</p>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    document.getElementById("topLinks").innerHTML = `<p>Failed to load top links.</p>`;
    showToast("Failed to load top links", "error");
  }
}

function copyShortUrl(code) {
  const shortUrl = `${SHORT_BASE}/${code}`;
  navigator.clipboard.writeText(shortUrl);
  showToast("Short link copied", "success");
}

async function shareUrl(code) {
  const shortUrl = `${SHORT_BASE}/${code}`;

  try {
    if (navigator.share) {
      await navigator.share({
        title: "Short URL",
        text: "Check this short link",
        url: shortUrl
      });
    } else {
      navigator.clipboard.writeText(shortUrl);
      showToast("Share not supported. Link copied instead.", "info");
    }
  } catch (error) {
    console.error("Share cancelled or failed");
  }
>>>>>>> 0ca757b01c82d1657c42d8d3dd5af3f9c25d7254
}

function toggleTheme() {
  document.body.classList.toggle("light");
<<<<<<< HEAD
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
=======
  const isLight = document.body.classList.contains("light");
  localStorage.setItem("theme", isLight ? "light" : "dark");
  loadStats();
}

function loadTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    document.body.classList.add("light");
  }
}

loadTheme();
updateAuthUI();
loadUsers();
loadStats();
loadUrls();
loadTopLinks();

setTimeout(() => {
  applyStaggerAnimation("dashboard");
}, 150);
>>>>>>> 0ca757b01c82d1657c42d8d3dd5af3f9c25d7254

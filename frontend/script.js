// CONFIG
const API_BASE = window.location.hostname.includes("localhost")
  ? "http://localhost:5000/api"
  : "https://url-shortener-backend-ib6u.onrender.com/api";

const SHORT_BASE = window.location.hostname.includes("localhost")
  ? "http://localhost:5000"
  : "https://url-shortener-backend-ib6u.onrender.com";

// AUTH
function getToken() {
  return localStorage.getItem("token");
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

function getCurrentUser() {
  const u = localStorage.getItem("user");
  return u ? JSON.parse(u) : null;
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`
  };
}

function updateAuthUI() {
  const user = getCurrentUser();

  const sidebarUser = document.getElementById("sidebarUser");
  if (sidebarUser) {
    sidebarUser.textContent = user ? user.name : "Not logged in";
  }

  const currentUserText = document.getElementById("currentUserText");
  if (currentUserText) {
    currentUserText.textContent = user
      ? `Logged in as ${user.name} (${user.email})`
      : "Not logged in";
  }
}

// LOGIN
async function loginUser() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (!res.ok) return alert(data.error || "Login failed");

  setCurrentUser(data.user, data.token);
  location.reload();
}

// SIGNUP
async function signupUser() {
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();

  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password })
  });

  const data = await res.json();
  if (!res.ok) return alert(data.error || "Signup failed");

  setCurrentUser(data.user, data.token);
  location.reload();
}

function logoutUser() {
  clearCurrentUser();
  location.reload();
}

// SHORTEN URL
async function shortenUrl() {
  if (!getToken()) {
    alert("Please login first");
    return;
  }

  const originalUrl = document.getElementById("originalUrl").value.trim();
  const customCode = document.getElementById("customCode").value.trim().toLowerCase();
  const expiresAt = document.getElementById("expiresAt")?.value || null;

  const res = await fetch(`${API_BASE}/urls/shorten`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ originalUrl, customCode, expiresAt })
  });

  const data = await res.json();
  if (!res.ok) return alert(data.error || "URL shorten failed");

  const result = document.getElementById("result");
  if (result) {
    result.innerHTML = `
      <div class="message-success">
        <strong>Short URL created:</strong><br>
        <a href="${data.shortUrl}" target="_blank">${data.shortUrl}</a>
      </div>
    `;
  }

  const qrBox = document.getElementById("qrBox");
  if (qrBox) {
    qrBox.innerHTML = `
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(data.shortUrl)}" alt="QR Code">
    `;
  }

  document.getElementById("originalUrl").value = "";
  document.getElementById("customCode").value = "";
  if (document.getElementById("expiresAt")) {
    document.getElementById("expiresAt").value = "";
  }

  alert("Short URL created successfully");
  loadUrls();
  loadStats();
}

// LOAD URLS
async function loadUrls() {
  if (!getToken()) return;

  const res = await fetch(`${API_BASE}/urls`, {
    headers: authHeaders()
  });

  const urls = await res.json();
  const list = document.getElementById("urlList");
  if (!list) return;

  if (!Array.isArray(urls) || urls.length === 0) {
    list.innerHTML = `<p>No URLs found.</p>`;
    return;
  }

  list.innerHTML = urls
    .map((u) => {
      const shortUrl = `${SHORT_BASE}/${u.short_code}`;

      return `
        <div class="list-item">
          <div class="list-item-top">
            <div class="code-badge">${u.short_code}</div>
            <div class="click-badge">${u.click_count || 0} Clicks</div>
          </div>

          <p>
            <strong>Original URL:</strong><br>
            <a href="${u.original_url}" target="_blank">${u.original_url}</a>
          </p>

          <p>
            <strong>Short URL:</strong><br>
            <a href="${shortUrl}" target="_blank">${shortUrl}</a>
          </p>

          <div class="actions">
            <button class="btn btn-secondary btn-small" onclick="copyShortUrl('${shortUrl}')">Copy</button>
            <button class="btn btn-secondary btn-small" onclick="shareShortUrl('${shortUrl}')">Share</button>
            <button class="btn btn-danger btn-small" onclick="deleteUrl('${u.short_code}')">Delete</button>
          </div>
        </div>
      `;
    })
    .join("");
}

// STATS
async function loadStats() {
  if (!getToken()) return;

  const res = await fetch(`${API_BASE}/analytics/summary`, {
    headers: authHeaders()
  });

  const data = await res.json();

  const statsBox = document.getElementById("statsBox");
  if (statsBox) {
    statsBox.innerHTML = `
      <div class="stat-card">
        <h4>Total URLs</h4>
        <p>${data.totalUrls || 0}</p>
      </div>
      <div class="stat-card">
        <h4>Total Clicks</h4>
        <p>${data.totalClicks || 0}</p>
      </div>
      <div class="stat-card">
        <h4>Avg Clicks</h4>
        <p>${data.avgClicksPerUrl || 0}</p>
      </div>
    `;
  }

  const analyticsStatsBox = document.getElementById("analyticsStatsBox");
  if (analyticsStatsBox) {
    analyticsStatsBox.innerHTML = statsBox ? statsBox.innerHTML : "";
  }
}

// DELETE URL
async function deleteUrl(code) {
  if (!confirm("Are you sure you want to delete this URL?")) return;

  const res = await fetch(`${API_BASE}/urls/${code}`, {
    method: "DELETE",
    headers: authHeaders()
  });

  const data = await res.json();
  if (!res.ok) return alert(data.error || "Delete failed");

  alert("URL deleted successfully");
  loadUrls();
  loadStats();
}

// COPY
function copyShortUrl(url) {
  navigator.clipboard.writeText(url);
  alert("Short URL copied");
}

// SHARE
async function shareShortUrl(url) {
  if (navigator.share) {
    await navigator.share({
      title: "Short URL",
      text: "Check this short link",
      url
    });
  } else {
    navigator.clipboard.writeText(url);
    alert("Share not supported. Link copied");
  }
}

// THEME
function toggleTheme() {
  document.body.classList.toggle("light");
  localStorage.setItem(
    "theme",
    document.body.classList.contains("light") ? "light" : "dark"
  );
}

// INIT
window.onload = () => {
  if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light");
  }

  updateAuthUI();

  const customCodeInput = document.getElementById("customCode");
  if (customCodeInput) {
    customCodeInput.addEventListener("input", (e) => {
      e.target.value = e.target.value.toLowerCase();
    });
  }

  if (getToken()) {
    loadUrls();
    loadStats();
  }
};
// ===== UI FUNCTIONS FIX =====

// Auth popup toggle
function toggleAuthPopup() {
  const popup = document.getElementById("authPopup");
  if (!popup) return;

  popup.style.display =
    popup.style.display === "block" ? "none" : "block";
}

// Section switch (Dashboard / Links / Analytics etc.)
function showSection(sectionId) {
  const sections = document.querySelectorAll(".section");

  sections.forEach((sec) => {
    sec.style.display = "none";
  });

  const target = document.getElementById(sectionId);
  if (target) {
    target.style.display = "block";
  }
}
// Go to section from buttons
function goToSection(sectionId, navIndex) {
  const navItems = document.querySelectorAll(".nav-item");
  const navButton = navItems[navIndex] || null;

  showSection(sectionId, navButton);
}
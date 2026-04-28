// CONFIG
const API_BASE =
  window.location.hostname.includes("localhost") ||
  window.location.hostname.includes("127.0.0.1")
    ? "http://localhost:5000/api"
    : "https://url-shortener-backend-ib6u.onrender.com/api";

const SHORT_BASE =
  window.location.hostname.includes("localhost") ||
  window.location.hostname.includes("127.0.0.1")
    ? "http://localhost:5000"
    : "https://url-shortener-backend-ib6u.onrender.com";

// HELPERS
function getToken() {
  return localStorage.getItem("token");
}

function getCurrentUser() {
  try {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`
  };
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

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

// UI
function updateAuthUI() {
  const user = getCurrentUser();

  const sidebarUser = document.getElementById("sidebarUser");
  if (sidebarUser) sidebarUser.textContent = user ? user.name : "Not logged in";

  const currentUserText = document.getElementById("currentUserText");
  if (currentUserText) {
    currentUserText.textContent = user
      ? `Logged in as ${user.name} (${user.email})`
      : "Not logged in";
  }
}

function toggleAuthPopup() {
  const popup = document.getElementById("authPopup");
  if (popup) popup.classList.toggle("hidden");
}

function showSection(sectionId, clickedButton) {
  document.querySelectorAll(".content-section").forEach((section) => {
    section.classList.remove("active-section");
  });

  const target = document.getElementById(sectionId);
  if (target) target.classList.add("active-section");

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.remove("active");
  });

  if (clickedButton) clickedButton.classList.add("active");

  if (sectionId === "dashboard") loadStats();
  if (sectionId === "links") loadUrls();
  if (sectionId === "analytics") {
    loadStats();
    loadTopLinks();
  }
}

function goToSection(sectionId, navIndex) {
  const navItems = document.querySelectorAll(".nav-item");
  showSection(sectionId, navItems[navIndex] || null);
}

function toggleTheme() {
  document.body.classList.toggle("light");
  localStorage.setItem(
    "theme",
    document.body.classList.contains("light") ? "light" : "dark"
  );
}

// AUTH
async function signupUser() {
  const name = document.getElementById("signupName")?.value.trim();
  const email = document.getElementById("signupEmail")?.value.trim();
  const password = document.getElementById("signupPassword")?.value.trim();

  if (!name || !email || !password) {
    alert("Please fill all signup fields");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Signup error:", data);
      alert(data.error || data.message || "Failed to create account");
      return;
    }

    setCurrentUser(data.user, data.token);
    alert("Account created successfully");
    toggleAuthPopup();
    loadStats();
    loadUrls();
  } catch (error) {
    console.error("Signup network error:", error);
    alert("Backend connection failed. Check Render backend is live.");
  }
}

async function loginUser() {
  const email = document.getElementById("loginEmail")?.value.trim();
  const password = document.getElementById("loginPassword")?.value.trim();

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Login error:", data);
      alert(data.error || data.message || "Login failed");
      return;
    }

    setCurrentUser(data.user, data.token);
    alert("Login successful");
    toggleAuthPopup();
    loadStats();
    loadUrls();
  } catch (error) {
    console.error("Login network error:", error);
    alert("Backend connection failed. Check Render backend is live.");
  }
}

function logoutUser() {
  clearCurrentUser();
  location.reload();
}

// SHORTEN
async function shortenUrl() {
  if (!getToken()) {
    alert("Please login first");
    return;
  }

  const originalUrl = document.getElementById("originalUrl")?.value.trim();
  const customCode = document.getElementById("customCode")?.value.trim().toLowerCase();
  const expiresAt = document.getElementById("expiresAt")?.value || null;

  if (!originalUrl) {
    alert("Please enter original URL");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/urls/shorten`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ originalUrl, customCode, expiresAt })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || data.message || "URL shorten failed");
      return;
    }

    const result = document.getElementById("result");
    if (result) {
      result.innerHTML = `
        <div class="message-success">
          <strong>Short URL created:</strong><br>
          <a href="${escapeHtml(data.shortUrl)}" target="_blank">${escapeHtml(data.shortUrl)}</a>
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

    loadUrls();
    loadStats();
  } catch (error) {
    console.error("Shorten error:", error);
    alert("Backend connection failed while creating short URL");
  }
}

// URLS
async function loadUrls() {
  if (!getToken()) return;

  try {
    const res = await fetch(`${API_BASE}/urls`, {
      headers: authHeaders()
    });

    const urls = await res.json();
    const list = document.getElementById("urlList");
    if (!list) return;

    if (!res.ok) {
      list.innerHTML = `<p>Failed to load links.</p>`;
      return;
    }

    if (!Array.isArray(urls) || urls.length === 0) {
      list.innerHTML = `<p>No URLs found. Create your first link!</p>`;
      return;
    }

    list.innerHTML = urls
      .map((u) => {
        const shortUrl = `${SHORT_BASE}/${u.short_code}`;

        return `
          <div class="list-item">
            <div class="list-item-top">
              <div class="code-badge">${escapeHtml(u.short_code)}</div>
              <div class="click-badge">${u.click_count || 0} Clicks</div>
            </div>

            <p>
              <strong>Original URL:</strong><br>
              <a href="${escapeHtml(u.original_url)}" target="_blank">${escapeHtml(u.original_url)}</a>
            </p>

            <p>
              <strong>Short URL:</strong><br>
              <a href="${escapeHtml(shortUrl)}" target="_blank">${escapeHtml(shortUrl)}</a>
            </p>

            <div class="actions">
              <button class="btn btn-secondary btn-small" onclick="copyShortUrl('${escapeHtml(shortUrl)}')">Copy</button>
              <button class="btn btn-secondary btn-small" onclick="shareShortUrl('${escapeHtml(shortUrl)}')">Share</button>
              <button class="btn btn-danger btn-small" onclick="deleteUrl('${escapeHtml(u.short_code)}')">Delete</button>
            </div>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Load URLs error:", error);
  }
}

async function deleteUrl(code) {
  if (!confirm("Are you sure you want to delete this URL?")) return;

  try {
    const res = await fetch(`${API_BASE}/urls/${code}`, {
      method: "DELETE",
      headers: authHeaders()
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || data.message || "Delete failed");
      return;
    }

    loadUrls();
    loadStats();
  } catch (error) {
    console.error("Delete error:", error);
    alert("Backend connection failed while deleting URL");
  }
}

function copyShortUrl(url) {
  navigator.clipboard.writeText(url);
  alert("Short URL copied");
}

async function shareShortUrl(url) {
  if (navigator.share) {
    await navigator.share({
      title: "Short URL",
      text: "Check this short link",
      url
    });
  } else {
    await navigator.clipboard.writeText(url);
    alert("Share not supported. Link copied");
  }
}

// STATS
async function loadStats() {
  if (!getToken()) return;

  try {
    const res = await fetch(`${API_BASE}/analytics/summary`, {
      headers: authHeaders()
    });

    const data = await res.json();
    if (!res.ok) return;

    const html = `
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

    const statsBox = document.getElementById("statsBox");
    if (statsBox) statsBox.innerHTML = html;

    const analyticsStatsBox = document.getElementById("analyticsStatsBox");
    if (analyticsStatsBox) analyticsStatsBox.innerHTML = html;
  } catch (error) {
    console.error("Stats error:", error);
  }
}

async function loadTopLinks() {
  if (!getToken()) return;

  const box = document.getElementById("topLinks");
  if (!box) return;

  try {
    const res = await fetch(`${API_BASE}/analytics/top-links`, {
      headers: authHeaders()
    });

    const links = await res.json();

    if (!res.ok || !Array.isArray(links) || links.length === 0) {
      box.innerHTML = `<p>No top links yet.</p>`;
      return;
    }

    box.innerHTML = links
      .map(
        (link) => `
        <div class="list-item">
          <div class="list-item-top">
            <div class="code-badge">${escapeHtml(link.short_code)}</div>
            <div class="click-badge">${link.click_count || 0} Clicks</div>
          </div>
          <p>${escapeHtml(link.original_url)}</p>
        </div>
      `
      )
      .join("");
  } catch (error) {
    console.error("Top links error:", error);
    box.innerHTML = `<p>Failed to load top links.</p>`;
  }
}

// INIT
window.addEventListener("load", () => {
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
    loadStats();
    loadUrls();
  }
});
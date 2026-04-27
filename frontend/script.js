// CONFIG
const API_BASE = window.location.hostname.includes("localhost")
  ? "http://localhost:5000/api"
  : "https://YOUR-RENDER-URL.onrender.com/api";

const SHORT_BASE = window.location.hostname.includes("localhost")
  ? "http://localhost:5000"
  : "https://YOUR-RENDER-URL.onrender.com";

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
  document.getElementById("sidebarUser").textContent = user
    ? user.name
    : "Not logged in";
}

// LOGIN
async function loginUser() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (!res.ok) return alert(data.error);

  setCurrentUser(data.user, data.token);
  location.reload();
}

// SIGNUP
async function signupUser() {
  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password })
  });

  const data = await res.json();
  if (!res.ok) return alert(data.error);

  setCurrentUser(data.user, data.token);
  location.reload();
}

function logoutUser() {
  clearCurrentUser();
  location.reload();
}

// SHORTEN
async function shortenUrl() {
  const originalUrl = document.getElementById("originalUrl").value;
  const customCode = document
    .getElementById("customCode")
    .value.toLowerCase();

  const res = await fetch(`${API_BASE}/urls/shorten`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ originalUrl, customCode })
  });

  const data = await res.json();
  if (!res.ok) return alert(data.error);

  alert("Short URL: " + data.shortUrl);
  loadUrls();
}

// LOAD URLS
async function loadUrls() {
  const res = await fetch(`${API_BASE}/urls`, {
    headers: authHeaders()
  });

  const urls = await res.json();
  const list = document.getElementById("urlList");

  list.innerHTML = urls
    .map(
      (u) => `
    <div>
      <b>${u.short_code}</b> → ${u.click_count} clicks
      <br/>
      <a href="${SHORT_BASE}/${u.short_code}" target="_blank">
        ${SHORT_BASE}/${u.short_code}
      </a>
    </div>`
    )
    .join("");
}

// STATS
async function loadStats() {
  const res = await fetch(`${API_BASE}/analytics/summary`, {
    headers: authHeaders()
  });

  const data = await res.json();

  document.getElementById("statsBox").innerHTML = `
    Total URLs: ${data.totalUrls} <br/>
    Total Clicks: ${data.totalClicks} <br/>
    Avg Clicks: ${data.avgClicksPerUrl}
  `;
}

// INIT
window.onload = () => {
  updateAuthUI();
  if (getToken()) {
    loadUrls();
    loadStats();
  }
};
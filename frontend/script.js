const API_BASE = "http://localhost:5000/api";
const SHORT_BASE = "http://localhost:5000";

const URL_REGEX =
  /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,10}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;

let analyticsChart = null;
let analyticsChartSecondary = null;

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
  }, 2600);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function animateValue(element, start, end, duration) {
  if (!element) return;

  const isFloat = String(end).includes(".");
  let startTime = null;

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const current = progress * (end - start) + start;

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
}

function goToSection(sectionId, navIndex) {
  const navItems = document.querySelectorAll(".nav-item");
  showSection(sectionId, navItems[navIndex]);
}

function toggleAuthPopup() {
  const popup = document.getElementById("authPopup");
  popup.classList.toggle("hidden");
}

function getToken() {
  return localStorage.getItem("token");
}

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
}

function logoutUser() {
  clearCurrentUser();
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
    }
  });
}

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
}

function toggleTheme() {
  document.body.classList.toggle("light");
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
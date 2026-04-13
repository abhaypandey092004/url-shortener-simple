const API_BASE = "http://localhost:5000/api";

const URL_REGEX =
  /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;

function showMessage(message, isError = false) {
  const result = document.getElementById("result");

  result.className = isError ? "result-box" : "result-success";
  result.innerHTML = isError
    ? `<span style="color:#fca5a5;">${message}</span>`
    : message;
}

async function createUser() {
  const userNameInput = document.getElementById("userName");
  const userName = userNameInput.value.trim();

  if (!userName) {
    alert("User name is required");
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name: userName })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Failed to create user");
      return;
    }

    userNameInput.value = "";
    await loadUsers();
    alert("User created successfully");
  } catch (error) {
    alert("Server error while creating user");
  }
}

async function loadUsers() {
  try {
    const response = await fetch(`${API_BASE}/users`);
    const users = await response.json();

    const userSelect = document.getElementById("userSelect");
    userSelect.innerHTML = `<option value="">Select user (optional)</option>`;

    users.forEach((user) => {
      userSelect.innerHTML += `
        <option value="${user.id}">${user.name}</option>
      `;
    });
  } catch (error) {
    console.error("Failed to load users");
  }
}

async function shortenUrl() {
  const originalUrl = document.getElementById("originalUrl").value.trim();
  const customCode = document.getElementById("customCode").value.trim();
  const userId = document.getElementById("userSelect").value;

  if (!URL_REGEX.test(originalUrl)) {
    showMessage("Please enter a valid URL starting with http:// or https://", true);
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/shorten`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        originalUrl,
        customCode,
        userId: userId || null
      })
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.error || "Something went wrong", true);
      return;
    }

    showMessage(`
      <strong>Short URL created successfully:</strong><br />
      <a href="${data.shortUrl}" target="_blank">${data.shortUrl}</a>
    `);

    document.getElementById("originalUrl").value = "";
    document.getElementById("customCode").value = "";

    await loadUrls();
    await loadStats();
    await loadTopLinks();
  } catch (error) {
    showMessage("Server error while shortening URL", true);
  }
}

async function loadStats() {
  try {
    const response = await fetch(`${API_BASE}/stats`);
    const data = await response.json();

    document.getElementById("statsBox").innerHTML = `
      <div class="stat-card">
        <h4>Total URLs</h4>
        <p>${data.totalUrls}</p>
      </div>
      <div class="stat-card">
        <h4>Total Clicks</h4>
        <p>${data.totalClicks}</p>
      </div>
      <div class="stat-card">
        <h4>Total Users</h4>
        <p>${data.totalUsers}</p>
      </div>
      <div class="stat-card">
        <h4>Avg Clicks / URL</h4>
        <p>${data.avgClicksPerUrl}</p>
      </div>
    `;
  } catch (error) {
    document.getElementById("statsBox").innerHTML =
      `<p class="empty-text">Failed to load statistics.</p>`;
  }
}

async function loadUrls() {
  try {
    const response = await fetch(`${API_BASE}/urls`);
    const urls = await response.json();

    const urlList = document.getElementById("urlList");

    if (!urls.length) {
      urlList.innerHTML = `<p class="empty-text">No URLs found.</p>`;
      return;
    }

    urlList.innerHTML = urls
      .map((url) => {
        return `
          <div class="list-item">
            <div class="list-item-top">
              <div class="code-badge">${url.short_code}</div>
              <div class="user-badge">${url.user_name || "No User"}</div>
            </div>

            <p>
              <strong>Original URL:</strong><br />
              <a href="${url.original_url}" target="_blank">${url.original_url}</a>
            </p>

            <p><strong>Clicks:</strong> ${url.click_count}</p>

            <div class="actions">
              <button class="btn btn-secondary btn-small" onclick="copyShortUrl('${url.short_code}')">
                Copy Link
              </button>
              <button class="btn btn-danger btn-small" onclick="deleteUrl('${url.short_code}')">
                Delete
              </button>
            </div>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    document.getElementById("urlList").innerHTML =
      `<p class="empty-text">Failed to load URLs.</p>`;
  }
}

async function deleteUrl(code) {
  const isConfirmed = confirm("Are you sure you want to delete this URL?");
  if (!isConfirmed) return;

  try {
    const response = await fetch(`${API_BASE}/urls/${code}`, {
      method: "DELETE"
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Delete failed");
      return;
    }

    await loadUrls();
    await loadStats();
    await loadTopLinks();
  } catch (error) {
    alert("Server error while deleting URL");
  }
}

async function loadTopLinks() {
  try {
    const response = await fetch(`${API_BASE}/top-links`);
    const links = await response.json();

    const topLinks = document.getElementById("topLinks");

    if (!links.length) {
      topLinks.innerHTML = `<p class="empty-text">No top links yet.</p>`;
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
              <strong>Original URL:</strong><br />
              <a href="${link.original_url}" target="_blank">${link.original_url}</a>
            </p>

            <p><strong>Clicks:</strong> ${link.click_count}</p>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    document.getElementById("topLinks").innerHTML =
      `<p class="empty-text">Failed to load top links.</p>`;
  }
}

function copyShortUrl(code) {
  const shortUrl = `http://localhost:5000/${code}`;
  navigator.clipboard.writeText(shortUrl);
  alert("Short link copied");
}

loadUsers();
loadStats();
loadUrls();
loadTopLinks();
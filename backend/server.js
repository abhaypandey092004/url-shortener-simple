const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
    return;
  }
  console.log("✅ Database connected");
});

const PORT = process.env.PORT || 5000;

const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;

function isValidUrl(url) {
  return URL_REGEX.test(url);
}

function generateShortCode(length = 6) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function generateUniqueCode(callback) {
  const code = generateShortCode();
  db.query("SELECT * FROM urls WHERE short_code = ?", [code], (err, rows) => {
    if (err) return callback(err);
    if (rows.length > 0) {
      generateUniqueCode(callback);
    } else {
      callback(null, code);
    }
  });
}

/* Health */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

/* Create user */
app.post("/api/users", (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "User name is required" });
  }

  db.query(
    "INSERT INTO users (name) VALUES (?)",
    [name.trim()],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: "Failed to create user" });
      }

      res.json({
        id: result.insertId,
        name: name.trim()
      });
    }
  );
});

/* Get users */
app.get("/api/users", (req, res) => {
  db.query("SELECT * FROM users ORDER BY created_at DESC", (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Failed to fetch users" });
    }
    res.json(rows);
  });
});

/* JOIN query: user with all links */
app.get("/api/users/:id/urls", (req, res) => {
  const userId = req.params.id;

  const sql = `
    SELECT 
      urls.id,
      urls.original_url,
      urls.short_code,
      urls.click_count,
      urls.created_at,
      users.name AS user_name
    FROM urls
    LEFT JOIN users ON urls.user_id = users.id
    WHERE urls.user_id = ?
    ORDER BY urls.created_at DESC
  `;

  db.query(sql, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Failed to fetch user URLs" });
    }
    res.json(rows);
  });
});

/* Create short URL */
app.post("/api/shorten", (req, res) => {
  const { originalUrl, customCode, userId } = req.body;

  // Backend validation
  if (!originalUrl || !isValidUrl(originalUrl)) {
    return res.status(400).json({
      error: "Invalid URL. Must start with http:// or https://"
    });
  }

  if (customCode && !/^[a-zA-Z0-9]{3,20}$/.test(customCode)) {
    return res.status(400).json({
      error: "Custom code must be 3 to 20 alphanumeric characters"
    });
  }

  const saveUrl = (code) => {
    db.query(
      "INSERT INTO urls (original_url, short_code, user_id) VALUES (?, ?, ?)",
      [originalUrl, code, userId || null],
      (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ error: "Short code already exists" });
          }
          return res.status(500).json({ error: "Failed to shorten URL" });
        }

        res.json({
          id: result.insertId,
          originalUrl,
          shortCode: code,
          shortUrl: `http://localhost:${PORT}/${code}`
        });
      }
    );
  };

  if (customCode) {
    saveUrl(customCode);
  } else {
    generateUniqueCode((err, code) => {
      if (err) {
        return res.status(500).json({ error: "Code generation failed" });
      }
      saveUrl(code);
    });
  }
});

/* Redirect + increment click count */
app.get("/:code", (req, res) => {
  const code = req.params.code;

  db.query("SELECT * FROM urls WHERE short_code = ?", [code], (err, rows) => {
    if (err) {
      return res.status(500).send("Server error");
    }

    if (rows.length === 0) {
      return res.status(404).send("Short URL not found");
    }

    const url = rows[0];

    db.query(
      "UPDATE urls SET click_count = click_count + 1 WHERE short_code = ?",
      [code],
      (updateErr) => {
        if (updateErr) {
          return res.status(500).send("Failed to update click count");
        }

        res.redirect(url.original_url);
      }
    );
  });
});

/* Get all links */
app.get("/api/urls", (req, res) => {
  const sql = `
    SELECT 
      urls.id,
      urls.original_url,
      urls.short_code,
      urls.click_count,
      urls.created_at,
      users.name AS user_name
    FROM urls
    LEFT JOIN users ON urls.user_id = users.id
    ORDER BY urls.created_at DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Failed to fetch URLs" });
    }
    res.json(rows);
  });
});

/* Delete URL */
app.delete("/api/urls/:code", (req, res) => {
  const code = req.params.code;

  db.query("DELETE FROM urls WHERE short_code = ?", [code], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Failed to delete URL" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "URL not found" });
    }

    res.json({ success: true });
  });
});

/* Stats */
app.get("/api/stats", (req, res) => {
  const statsQuery = `
    SELECT 
      COUNT(*) AS totalUrls,
      IFNULL(SUM(click_count), 0) AS totalClicks,
      IFNULL(AVG(click_count), 0) AS avgClicksPerUrl
    FROM urls
  `;

  const usersQuery = `SELECT COUNT(*) AS totalUsers FROM users`;

  db.query(statsQuery, (err, urlStats) => {
    if (err) {
      return res.status(500).json({ error: "Failed to fetch stats" });
    }

    db.query(usersQuery, (err2, userStats) => {
      if (err2) {
        return res.status(500).json({ error: "Failed to fetch user stats" });
      }

      res.json({
        totalUrls: urlStats[0].totalUrls,
        totalClicks: urlStats[0].totalClicks,
        avgClicksPerUrl: Number(urlStats[0].avgClicksPerUrl).toFixed(2),
        totalUsers: userStats[0].totalUsers
      });
    });
  });
});

/* Top links */
app.get("/api/top-links", (req, res) => {
  const sql = `
    SELECT 
      urls.id,
      urls.original_url,
      urls.short_code,
      urls.click_count,
      users.name AS user_name
    FROM urls
    LEFT JOIN users ON urls.user_id = users.id
    ORDER BY urls.click_count DESC
    LIMIT 5
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Failed to fetch top links" });
    }
    res.json(rows);
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
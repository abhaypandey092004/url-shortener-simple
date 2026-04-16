const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "my_super_secret_key";
const APP_BASE_URL = process.env.APP_BASE_URL || `http://localhost:${PORT}`;

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
    return;
  }
  console.log("✅ Database connected");
});

const URL_REGEX =
  /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,10}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;

function isValidUrl(url) {
  return URL_REGEX.test(url);
}

function generateShortCode(length = 6) {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }

  return result;
}

function generateUniqueCode(callback) {
  const code = generateShortCode();

  db.query("SELECT id FROM urls WHERE short_code = ?", [code], (err, rows) => {
    if (err) return callback(err);

    if (rows.length > 0) {
      return generateUniqueCode(callback);
    }

    callback(null, code);
  });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. Token missing." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}

/* Root */
app.get("/", (req, res) => {
  res.send("Server working");
});

/* Health */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

/* Signup */
app.post("/api/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Name is required" });
  }

  if (!email || !email.trim()) {
    return res.status(400).json({ error: "Email is required" });
  }

  if (!password || password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters" });
  }

  db.query(
    "SELECT id FROM users WHERE email = ?",
    [email.trim()],
    async (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Failed to check existing user" });
      }

      if (rows.length > 0) {
        return res.status(400).json({ error: "Email already registered" });
      }

      try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.query(
          "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
          [name.trim(), email.trim(), hashedPassword],
          (insertErr, result) => {
            if (insertErr) {
              return res.status(500).json({ error: "Failed to create account" });
            }

            const token = jwt.sign(
              { id: result.insertId, name: name.trim(), email: email.trim() },
              JWT_SECRET,
              { expiresIn: "7d" }
            );

            return res.json({
              message: "Signup successful",
              token,
              user: {
                id: result.insertId,
                name: name.trim(),
                email: email.trim(),
              },
            });
          }
        );
      } catch (hashError) {
        return res.status(500).json({ error: "Failed to secure password" });
      }
    }
  );
});

/* Login */
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !email.trim()) {
    return res.status(400).json({ error: "Email is required" });
  }

  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email.trim()],
    async (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Failed to login" });
      }

      if (rows.length === 0) {
        return res.status(400).json({ error: "Invalid email or password" });
      }

      const user = rows[0];

      try {
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          return res.status(400).json({ error: "Invalid email or password" });
        }

        const token = jwt.sign(
          { id: user.id, name: user.name, email: user.email },
          JWT_SECRET,
          { expiresIn: "7d" }
        );

        return res.json({
          message: "Login successful",
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
        });
      } catch (compareError) {
        return res.status(500).json({ error: "Failed to verify password" });
      }
    }
  );
});

/* Current user */
app.get("/api/me", authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

/* Get users */
app.get("/api/users", (req, res) => {
  db.query(
    "SELECT id, name, email, created_at FROM users ORDER BY created_at DESC",
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Failed to fetch users" });
      }

      return res.json(rows);
    }
  );
});

/* User-specific URLs */
app.get("/api/users/:id/urls", (req, res) => {
  const userId = req.params.id;

  const sql = `
    SELECT 
      urls.id,
      urls.original_url,
      urls.short_code,
      urls.click_count,
      urls.expires_at,
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

    return res.json(rows);
  });
});

/* Create short URL */
app.post("/api/shorten", authenticateToken, (req, res) => {
  const { originalUrl, customCode, expiresAt } = req.body;
  const userId = req.user.id;

  if (!originalUrl || !isValidUrl(originalUrl)) {
    return res.status(400).json({
      error: "Invalid URL. Must start with http:// or https://",
    });
  }

  if (customCode && !/^[a-zA-Z0-9]{3,20}$/.test(customCode)) {
    return res.status(400).json({
      error: "Custom code must be 3 to 20 alphanumeric characters",
    });
  }

  const expiryValue = expiresAt ? new Date(expiresAt) : null;

  if (expiresAt && Number.isNaN(expiryValue.getTime())) {
    return res.status(400).json({ error: "Invalid expiry date" });
  }

  const saveUrl = (code) => {
    db.query(
      "INSERT INTO urls (original_url, short_code, user_id, expires_at) VALUES (?, ?, ?, ?)",
      [originalUrl, code, userId, expiryValue],
      (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ error: "Short code already exists" });
          }

          return res.status(500).json({ error: "Failed to shorten URL" });
        }

        return res.json({
          id: result.insertId,
          originalUrl,
          shortCode: code,
          userId,
          expiresAt: expiryValue,
          shortUrl: `${APP_BASE_URL}/${code}`,
        });
      }
    );
  };

  if (customCode) {
    return saveUrl(customCode);
  }

  generateUniqueCode((err, code) => {
    if (err) {
      return res.status(500).json({ error: "Code generation failed" });
    }

    saveUrl(code);
  });
});

/* Redirect */
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

    if (url.expires_at && new Date(url.expires_at) < new Date()) {
      return res.status(410).send("This short URL has expired");
    }

    db.query(
      "UPDATE urls SET click_count = click_count + 1 WHERE short_code = ?",
      [code],
      (updateErr) => {
        if (updateErr) {
          return res.status(500).send("Failed to update click count");
        }

        return res.redirect(url.original_url);
      }
    );
  });
});

/* Get all URLs */
app.get("/api/urls", (req, res) => {
  const { userId } = req.query;

  let sql = `
    SELECT 
      urls.id,
      urls.original_url,
      urls.short_code,
      urls.click_count,
      urls.expires_at,
      urls.created_at,
      users.name AS user_name,
      users.id AS user_id
    FROM urls
    LEFT JOIN users ON urls.user_id = users.id
  `;

  const values = [];

  if (userId) {
    sql += " WHERE urls.user_id = ? ";
    values.push(userId);
  }

  sql += " ORDER BY urls.created_at DESC";

  db.query(sql, values, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Failed to fetch URLs" });
    }

    return res.json(rows);
  });
});

/* Delete URL */
app.delete("/api/urls/:code", authenticateToken, (req, res) => {
  const code = req.params.code;

  db.query(
    "DELETE FROM urls WHERE short_code = ? AND user_id = ?",
    [code, req.user.id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: "Failed to delete URL" });
      }

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ error: "URL not found or not owned by you" });
      }

      return res.json({ success: true });
    }
  );
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

    db.query(usersQuery, (userErr, userStats) => {
      if (userErr) {
        return res.status(500).json({ error: "Failed to fetch user stats" });
      }

      return res.json({
        totalUrls: urlStats[0].totalUrls,
        totalClicks: urlStats[0].totalClicks,
        avgClicksPerUrl: Number(urlStats[0].avgClicksPerUrl).toFixed(2),
        totalUsers: userStats[0].totalUsers,
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
      urls.expires_at,
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

    return res.json(rows);
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on ${APP_BASE_URL}`);
});
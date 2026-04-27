const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const authenticateToken = require("../middleware/auth");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");

// Rate limiting for shortening
const shortenLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: { error: "Too many links created, please try again after an hour" },
});

const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,10}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;

function generateShortCode(length = 6) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

async function generateUniqueCode() {
  const code = generateShortCode();
  const { data } = await supabase
    .from("urls")
    .select("id")
    .ilike("short_code", code)
    .maybeSingle();

  if (data) {
    return generateUniqueCode();
  }
  return code;
}

// Create short URL
router.post("/shorten", authenticateToken, shortenLimiter, [
  body("originalUrl").trim().isURL().withMessage("Invalid URL format").matches(URL_REGEX).withMessage("URL must start with http:// or https://"),
  body("customCode").optional().trim().isAlphanumeric().isLength({ min: 3, max: 20 }).withMessage("Custom code must be 3-20 alphanumeric characters"),
  body("expiresAt").optional().isISO8601().withMessage("Invalid expiry date format"),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { originalUrl, customCode, expiresAt } = req.body;
  const userId = req.user.id;

  try {
    let code = customCode ? customCode.toLowerCase() : null;

    if (code) {
      const { data: existing } = await supabase
        .from("urls")
        .select("id")
        .ilike("short_code", code)
        .maybeSingle();

      if (existing) {
        return res.status(400).json({ error: "Custom code already in use" });
      }
    } else {
      code = await generateUniqueCode();
    }

    const expiryValue = expiresAt ? new Date(expiresAt) : null;

    const { data: newUrl, error: insertError } = await supabase
      .from("urls")
      .insert([{ original_url: originalUrl, short_code: code, user_id: userId, expires_at: expiryValue }])
      .select()
      .maybeSingle();

    if (insertError) throw insertError;

    const APP_BASE_URL = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

    return res.status(201).json({
      id: newUrl.id,
      originalUrl,
      shortCode: code,
      userId,
      expiresAt: expiryValue,
      shortUrl: `${APP_BASE_URL}/${code}`,
    });
  } catch (error) {
    console.error("Shorten error:", error);
    return res.status(500).json({ error: "Failed to shorten URL" });
  }
});

// Get user URLs
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { data: urls, error } = await supabase
      .from("urls")
      .select(`
        id, original_url, short_code, click_count, 
        expires_at, created_at, users(name)
      `)
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Flatten user name from join
    const formattedUrls = urls.map(u => ({
      ...u,
      user_name: u.users ? u.users.name : "Unknown"
    }));

    return res.json(formattedUrls);
  } catch (error) {
    console.error("Fetch URLs error:", error);
    return res.status(500).json({ error: "Failed to fetch URLs" });
  }
});

// Delete URL
router.delete("/:code", authenticateToken, async (req, res) => {
  const code = req.params.code;

  try {
    const { data, error, count } = await supabase
      .from("urls")
      .delete()
      .eq("short_code", code)
      .eq("user_id", req.user.id);

    if (error) throw error;

    return res.json({ success: true, message: "URL deleted successfully" });
  } catch (error) {
    console.error("Delete URL error:", error);
    return res.status(500).json({ error: "Failed to delete URL" });
  }
});

module.exports = router;

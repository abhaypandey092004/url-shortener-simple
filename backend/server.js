const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const useragent = require("useragent");
require("dotenv").config();

const supabase = require("./config/supabase");
const authRoutes = require("./routes/authRoutes");
const urlRoutes = require("./routes/urlRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

// Global error handlers to prevent crashes
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));

// CORS Configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:3000",
  "http://127.0.0.1:3000"
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/urls", urlRoutes);
app.use("/api/analytics", analyticsRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date() });
});

// Redirect Logic
app.get("/:code", async (req, res) => {
  const code = req.params.code;
  
  if (code === "favicon.ico" || code === "robots.txt") return res.status(404).end();

  console.log(`🔍 Redirect Request: code='${code}'`);

  try {
    const { data: url, error } = await supabase
      .from("urls")
      .select("id, original_url, click_count, expires_at")
      .ilike("short_code", code)
      .maybeSingle();

    if (error) {
      console.error("❌ Supabase Error:", error.message);
      throw error;
    }

    if (!url) {
      console.log(`⚠️ Link not found: '${code}'`);
      return res.status(404).send(`
        <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
          <h1>404 - Link Not Found</h1>
          <p>The short link <strong>${code}</strong> does not exist.</p>
          <a href="${process.env.CLIENT_URL || '#'}">Back to Home</a>
        </div>
      `);
    }

    // Expiry check
    if (url.expires_at && new Date(url.expires_at) < new Date()) {
      return res.status(410).send("<h1>This short URL has expired</h1>");
    }

    // Capture tracking info
    const agent = useragent.parse(req.headers["user-agent"]);
    const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    const referrer = req.headers["referrer"] || req.headers["referer"] || "direct";
    
    let deviceType = "Desktop";
    const ua = req.headers["user-agent"] || "";
    if (/mobile/i.test(ua)) deviceType = "Mobile";
    else if (/tablet/i.test(ua)) deviceType = "Tablet";

    // Tracking logic - Optimized
    setImmediate(async () => {
      try {
        // 1. Atomic increment using RPC
        const { error: rpcError } = await supabase.rpc('increment_click_count', { target_url_id: url.id });
        
        // Fallback if RPC is missing
        if (rpcError) {
          console.warn("⚠️ RPC failed, trying manual increment...");
          await supabase
            .from("urls")
            .update({ click_count: (url.click_count || 0) + 1 })
            .eq("id", url.id);
        }

        // 2. Log click detail
        await supabase.from("url_clicks").insert([{
          url_id: url.id,
          ip_address: ipAddress,
          user_agent: ua,
          referrer: referrer,
          device_type: deviceType,
          browser: agent.family,
          os: agent.os.family
        }]);
        
        console.log(`📊 Click tracked for '${code}'`);
      } catch (err) {
        console.error("❌ Tracking Error:", err.message);
      }
    });

    return res.redirect(url.original_url);
  } catch (error) {
    console.error("❌ Redirect Error:", error.message);
    res.status(500).send("<h1>Internal Server Error</h1>");
  }
});

// Final 404 for API
app.use("/api/*", (req, res) => {
  res.status(404).json({ error: "API Route not found" });
});

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is busy. PERMANENT FIX:`);
    console.error(`   1. Run 'npx kill-port ${PORT}' manually.`);
    console.error(`   2. Or change PORT in .env file.`);
    process.exit(1);
  }
});

// Graceful Shutdown
const shutdown = () => {
  server.close(() => {
    process.exit(0);
  });
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
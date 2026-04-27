const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const useragent = require("useragent");
require("dotenv").config();

const supabase = require("./config/supabase");
const authRoutes = require("./routes/authRoutes");
const urlRoutes = require("./routes/urlRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});

app.use(helmet({ contentSecurityPolicy: false }));

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:3000",
  "http://127.0.0.1:3000"
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date() });
});

app.use("/api/auth", authRoutes);
app.use("/api/urls", urlRoutes);
app.use("/api/analytics", analyticsRoutes);

app.get("/:code", async (req, res) => {
  const code = req.params.code;

  if (code === "favicon.ico" || code === "robots.txt") {
    return res.status(404).end();
  }

  try {
    const { data: url, error } = await supabase
      .from("urls")
      .select("id, original_url, click_count, expires_at")
      .ilike("short_code", code)
      .maybeSingle();

    if (error) throw error;

    if (!url) {
      return res.status(404).send(`
        <div style="font-family:sans-serif;text-align:center;margin-top:50px;">
          <h1>404 - Link Not Found</h1>
          <p>The short link <strong>${code}</strong> does not exist.</p>
          <a href="${process.env.CLIENT_URL || "#"}">Back to Home</a>
        </div>
      `);
    }

    if (url.expires_at && new Date(url.expires_at) < new Date()) {
      return res.status(410).send("<h1>This short URL has expired</h1>");
    }

    const agent = useragent.parse(req.headers["user-agent"]);
    const ipAddress =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    const referrer = req.headers["referrer"] || req.headers["referer"] || "direct";
    const ua = req.headers["user-agent"] || "";

    let deviceType = "Desktop";
    if (/mobile/i.test(ua)) deviceType = "Mobile";
    else if (/tablet/i.test(ua)) deviceType = "Tablet";

    setImmediate(async () => {
      try {
        const { error: rpcError } = await supabase.rpc("increment_click_count", {
          target_url_id: url.id
        });

        if (rpcError) {
          await supabase
            .from("urls")
            .update({ click_count: (url.click_count || 0) + 1 })
            .eq("id", url.id);
        }

        await supabase.from("url_clicks").insert([{
          url_id: url.id,
          ip_address: ipAddress,
          user_agent: ua,
          referrer,
          device_type: deviceType,
          browser: agent.family,
          os: agent.os.family
        }]);
      } catch (err) {
        console.error("❌ Tracking Error:", err.message);
      }
    });

    return res.redirect(url.original_url);
  } catch (error) {
    console.error("❌ Redirect Error:", error.message);
    return res.status(500).send("<h1>Internal Server Error</h1>");
  }
});

app.use("/api/*", (req, res) => {
  res.status(404).json({ error: "API Route not found" });
});

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is busy. Change PORT in .env or stop old server.`);
    process.exit(1);
  }
  throw err;
});

const shutdown = () => {
  server.close(() => process.exit(0));
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
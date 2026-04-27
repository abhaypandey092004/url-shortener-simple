const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const authenticateToken = require("../middleware/auth");

// Summary stats for the logged-in user
router.get("/summary", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: urls, error: urlError } = await supabase
      .from("urls")
      .select("click_count")
      .eq("user_id", userId);

    if (urlError) throw urlError;

    const totalUrls = urls ? urls.length : 0;
    const totalClicks = urls ? urls.reduce((sum, u) => sum + (u.click_count || 0), 0) : 0;
    
    // Calculate average
    let avgClicksPerUrl = 0;
    if (totalUrls > 0) {
      avgClicksPerUrl = (totalClicks / totalUrls).toFixed(2);
    }

    console.log(`📊 Stats for User ${userId}: links=${totalUrls}, clicks=${totalClicks}`);

    res.json({
      totalUrls,
      totalClicks,
      avgClicksPerUrl: parseFloat(avgClicksPerUrl),
    });
  } catch (error) {
    console.error("Summary stats error:", error);
    res.status(500).json({ error: "Failed to fetch summary stats" });
  }
});

// Top links for the logged-in user
router.get("/top-links", authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("urls")
      .select("original_url, short_code, click_count, created_at")
      .eq("user_id", req.user.id)
      .order("click_count", { ascending: false })
      .limit(5);

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error("Top links error:", error);
    res.status(500).json({ error: "Failed to fetch top links" });
  }
});

// Clicks by date for the last 7 days
router.get("/clicks-by-date", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from("url_clicks")
      .select(`
        clicked_at,
        urls!inner(user_id)
      `)
      .eq("urls.user_id", userId)
      .gte("clicked_at", sevenDaysAgo.toISOString());

    if (error) throw error;

    const grouped = (data || []).reduce((acc, click) => {
      const date = click.clicked_at.split("T")[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const result = Object.entries(grouped).map(([date, clicks]) => ({ date, clicks }));
    res.json(result.sort((a, b) => a.date.localeCompare(b.date)));
  } catch (error) {
    console.error("Clicks by date error:", error);
    res.status(500).json({ error: "Failed to fetch clicks by date" });
  }
});

// Breakdown by device, browser, and OS
router.get("/breakdown", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from("url_clicks")
      .select(`
        device_type, browser, os,
        urls!inner(user_id)
      `)
      .eq("urls.user_id", userId);

    if (error) throw error;

    const aggregate = (arr, key) => {
      const counts = arr.reduce((acc, item) => {
        const val = item[key] || "Unknown";
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      }, {});
      return Object.entries(counts).map(([label, value]) => ({ label, value }));
    };

    const clicksData = data || [];
    res.json({
      devices: aggregate(clicksData, "device_type"),
      browsers: aggregate(clicksData, "browser"),
      os: aggregate(clicksData, "os"),
    });
  } catch (error) {
    console.error("Breakdown error:", error);
    res.status(500).json({ error: "Failed to fetch breakdown stats" });
  }
});

module.exports = router;

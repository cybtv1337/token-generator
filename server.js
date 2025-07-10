const express = require("express");
const puppeteer = require("puppeteer");
const app = express();

// Set port from Fly.io environment
const PORT = process.env.PORT || 8080;

// Create route
app.get("/generate-token", async (req, res) => {
  console.log("🔍 Route /generate-token triggered");

  let bearerToken = null;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    // Enable CDP session
    const client = await page.target().createCDPSession();
    await client.send("Network.enable");

    client.on("Network.requestWillBeSent", (params) => {
      const headers = params.request.headers;
      if (headers["Authorization"] && !bearerToken) {
        bearerToken = headers["Authorization"];
        console.log("🎯 Bearer token found:", bearerToken);
      }
    });

    // Visit target page
    await page.goto("https://tvmalaysia.live/channel/ria", { waitUntil: "networkidle2" });
    await page.waitForTimeout(5000); // Let requests flow

    await browser.close();

    // Respond with token or message
    res.json({
      token: bearerToken ? bearerToken : "⚠️ Token tidak dijumpai dalam request header."
    });

  } catch (err) {
    console.error("❌ Error during token intercept:", err.message);
    res.status(500).json({ error: "❌ Sniper gagal: " + err.message });
  }
});

// Start server on 0.0.0.0 for Fly.io
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Sniper server listening on 0.0.0.0:${PORT}`);
});
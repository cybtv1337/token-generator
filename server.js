const express = require("express");
const puppeteer = require("puppeteer");
const app = express();

const PORT = process.env.PORT || 8080;

app.get("/generate-token", async (req, res) => {
  console.log("🔍 Route /generate-token triggered");
  let bearerToken = null;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    const client = await page.target().createCDPSession();
    await client.send("Network.enable");

    client.on("Network.requestWillBeSent", (params) => {
      const headers = params.request.headers;
      if (headers["Authorization"] && !bearerToken) {
        bearerToken = headers["Authorization"];
        console.log("🎯 Bearer token captured:", bearerToken);
      }
    });

    await page.goto("https://tvmalaysia.live/channel/ria", { waitUntil: "networkidle2" });

    // Universal delay (instead of waitForTimeout)
    await new Promise(r => setTimeout(r, 5000));

    await browser.close();

    res.json({
      token: bearerToken ? bearerToken : "⚠️ Token tidak dijumpai dalam request header."
    });

  } catch (err) {
    console.error("❌ Intercept error:", err.message);
    res.status(500).json({ error: "❌ Sniper gagal: " + err.message });
  }
});

// 🔊 Listen globally for Fly.io
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Sniper server ready at 0.0.0.0:${PORT}`);
});
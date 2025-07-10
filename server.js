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

    // 🧠 Intercept Authorization header
    client.on("Network.requestWillBeSent", (params) => {
      const headers = params.request.headers;
      if (headers["Authorization"] && !bearerToken) {
        bearerToken = headers["Authorization"];
        console.log("🎯 Bearer token from header:", bearerToken);
      }
    });

    await page.goto("https://tvmalaysia.live/channel/ria", { waitUntil: "networkidle2" });

    // ⏳ Delay to allow token injection
    await new Promise(r => setTimeout(r, 15000));

    // 🪃 Fallback: Try localStorage
    if (!bearerToken) {
      bearerToken = await page.evaluate(() => {
        return window.localStorage.getItem("authToken");
      });
      if (bearerToken) {
        bearerToken = `Bearer ${bearerToken}`;
        console.log("🪃 Bearer token from localStorage:", bearerToken);
      }
    }

    await browser.close();

    res.json({
      token: bearerToken ? bearerToken : "⚠️ Token tidak dijumpai dalam header atau localStorage."
    });

  } catch (err) {
    console.error("❌ Token intercept error:", err.message);
    res.status(500).json({ error: "❌ Sniper gagal: " + err.message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Sniper server listening on 0.0.0.0:${PORT}`);
});
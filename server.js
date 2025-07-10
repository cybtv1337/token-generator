const express = require("express");
const puppeteer = require("puppeteer");
const app = express();

app.get("/generate-token", async (req, res) => {
  console.log("🔍 Endpoint /generate-token triggered");

  let bearerToken = null;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    console.log("🌀 Puppeteer launching browser...");

    const page = await browser.newPage();
    await page.goto("https://tvmalaysia.live/channel/ria", { waitUntil: "networkidle2" });

    console.log("⏳ Waiting for token injection...");
    await page.waitForTimeout(15000);

    bearerToken = await page.evaluate(() => {
      const fromLocal = window.localStorage.getItem("authToken");
      const fromSession = window.sessionStorage.getItem("authToken");
      const fromGlobal = typeof window.playerConfig === "object" ? window.playerConfig.token : null;
      return fromLocal || fromSession || fromGlobal || null;
    });

    await browser.close();
    console.log("✅ Token sniffed:", bearerToken);

    res.json({
      token: bearerToken ? `Bearer ${bearerToken}` : "⚠️ Token tidak dijumpai melalui JS context."
    });

  } catch (err) {
    console.error("❌ Sniper error:", err.message);
    res.status(500).json({
      error: "❌ Sniper gagal: " + err.message
    });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("🚀 Sniper server ready on port", PORT);
});
const express = require("express");
const puppeteer = require("puppeteer");
const app = express();

app.get("/generate-token", async (req, res) => {
  console.log("🔍 /generate-token route triggered");

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
        console.log("🎯 Token found in header:", bearerToken);
      }
    });

    await page.goto("https://tvmalaysia.live/channel/ria", { waitUntil: "networkidle2" });
    await page.waitForTimeout(5000); // Short delay to allow requests

    await browser.close();

    res.json({
      token: bearerToken ? bearerToken : "⚠️ Token tak dijumpai dalam request header."
    });

  } catch (err) {
    console.error("❌ Sniper CDP Error:", err.message);
    res.status(500).json({ error: "❌ CDP intercept gagal: " + err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("🚀 Sniper CDP server ready on port", PORT);
});
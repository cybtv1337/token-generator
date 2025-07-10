const express = require("express");
const puppeteer = require("puppeteer");
const app = express();

app.get("/generate-token", async (req, res) => {
  let bearerToken = null;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.goto("https://tvmalaysia.live/channel/ria", { waitUntil: "networkidle2" });
    await page.waitForTimeout(15000); // Allow JS token injection

    bearerToken = await page.evaluate(() => {
      const fromLocal = window.localStorage.getItem("authToken");
      const fromSession = window.sessionStorage.getItem("authToken");
      const fromGlobal = typeof window.playerConfig === "object" ? window.playerConfig.token : null;
      return fromLocal || fromSession || fromGlobal || null;
    });
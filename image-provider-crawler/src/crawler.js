// src/crawler.js

const { chromium } = require("playwright");

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/144.0.0.0 Safari/537.36";

async function crawlPage(url, browser) {
  const context = await browser.newContext({
    userAgent: UA,
    locale: "en-AU",
    viewport: { width: 1366, height: 900 },
  });

  const page = await context.newPage();

  const network = {
    cloudinary: new Set(),
    gtauImages: new Set(),
  };

  page.on("request", (req) => {
    const u = req.url().toLowerCase();
    if (u.includes("cloudinary")) network.cloudinary.add(req.url());
    if (u.includes("images.") && u.includes(".gtau.net")) network.gtauImages.add(req.url());
  });

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(8000);

    const outerHTML = await page.evaluate(() => document.documentElement.outerHTML);

    return {
      url,
      outerHTML,
      network: {
        cloudinary: [...network.cloudinary],
        gtauImages: [...network.gtauImages],
      },
    };
  } finally {
    await context.close();
  }
}

async function createBrowser() {
  return await chromium.launch({
    channel: "chrome",
    headless: true,
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });
}

module.exports = { crawlPage, createBrowser };

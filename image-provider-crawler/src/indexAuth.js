// src/indexAuth.js
const fs = require("fs");
const path = require("path");
const { createBrowser } = require("./crawler");
const { loginToGumtree } = require("./auth");
const { extractFromDOM } = require("./extractors");
const { httpSanity } = require("./httpSanity");
const { renderReport } = require("./reportRenderer");
const { buildSummaryRows, buildSanityRows } = require("./reportRows");

const urls = fs.readFileSync(path.join(__dirname, "..", "statfulPages.txt"), "utf8")
  .split(/\r?\n/)
  .map(s => s.trim())
  .filter(Boolean);

const AUTH_EMAIL = "e.boe315@gumqabot.com.au";
const AUTH_PASSWORD = "gumtree";

async function crawlAuthenticatedPage(page, url, network) {
  try {
    console.log(`📥 Crawling authenticated page: ${url}...`);
    
    // Use 'load' instead of 'networkidle' to wait for ALL resources
    await page.goto(url, { waitUntil: "load", timeout: 60000 });
    
    // Wait significantly longer for all images and async content
    await page.waitForTimeout(10000);

    const outerHTML = await page.evaluate(() => document.documentElement.outerHTML);

    console.log(`  📊 Network captured: ${network.cloudinary.size} Cloudinary, ${network.gtauImages.size} GTAU`);

    return {
      url,
      outerHTML,
      network: {
        cloudinary: [...network.cloudinary],
        gtauImages: [...network.gtauImages],
      },
    };
  } catch (error) {
    throw error;
  }
}

(async () => {
  console.log(`🚀 Starting authenticated crawl of ${urls.length} URLs...`);
  
  // Create a single browser instance
  const browser = await createBrowser();
  
  try {
    // Create a persistent context for authentication
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
                 "AppleWebKit/537.36 (KHTML, like Gecko) " +
                 "Chrome/144.0.0.0 Safari/537.36",
      locale: "en-AU",
      viewport: { width: 1366, height: 900 },
    });

    const page = await context.newPage();

    // Perform login once
    const loginSuccess = await loginToGumtree(page, AUTH_EMAIL, AUTH_PASSWORD);
    
    if (!loginSuccess) {
      console.error("❌ Login failed. Exiting...");
      await browser.close();
      process.exit(1);
    }

    // Crawl all authenticated pages using the same logged-in context
    const crawlResults = [];
    for (const url of urls) {
      try {
        // Clear network tracking for this page
        const pageNetwork = {
          cloudinary: new Set(),
          gtauImages: new Set(),
        };

        // Create handlers BEFORE navigation
        const requestHandler = (req) => {
          const u = req.url().toLowerCase();
          
          // Debug logging for all requests
          console.log(`🔍 Request: ${req.url()}`);
          
          if (u.includes("cloudinary")) {
            console.log(`  ✓ Matched Cloudinary`);
            pageNetwork.cloudinary.add(req.url());
          }
          if (u.includes("images.") && u.includes(".gtau.net")) {
            console.log(`  ✓ Matched GTAU Images`);
            pageNetwork.gtauImages.add(req.url());
          }
        };

        const responseHandler = (res) => {
          const u = res.url().toLowerCase();
          console.log(`📥 Response: ${res.url()}`);
          
          if (u.includes("cloudinary")) {
            pageNetwork.cloudinary.add(res.url());
          }
          if (u.includes("images.") && u.includes(".gtau.net")) {
            pageNetwork.gtauImages.add(res.url());
          }
        };

        // Attach handlers BEFORE navigation
        page.on("request", requestHandler);
        page.on("response", responseHandler);

        const result = await crawlAuthenticatedPage(page, url, pageNetwork);
        
        // Remove handlers after crawl
        page.off("request", requestHandler);
        page.off("response", responseHandler);
        const dom = extractFromDOM(result.outerHTML);
        console.log(`✅ Completed ${url}`);
        
        crawlResults.push({
          url,
          domCloudinary: dom.cloudinary,
          domGtauImages: dom.gtauImages,
          reqCloudinary: result.network.cloudinary,
          reqGtauImages: result.network.gtauImages,
          headerCloudinary: dom.header.cloudinary,
          headerGtauImages: dom.header.gtauImages,
          bodyCloudinary: dom.body.cloudinary,
          bodyGtauImages: dom.body.gtauImages,
          dom,
          error: null,
        });
      } catch (error) {
        console.error(`❌ Failed ${url}: ${error.message}`);
        crawlResults.push({
          url,
          domCloudinary: [],
          domGtauImages: [],
          reqCloudinary: [],
          reqGtauImages: [],
          headerCloudinary: [],
          headerGtauImages: [],
          bodyCloudinary: [],
          bodyGtauImages: [],
          dom: { cloudinary: [], gtauImages: [], header: { cloudinary: [], gtauImages: [] }, body: { cloudinary: [], gtauImages: [] } },
          error: error.message,
        });
      }
    }

    const pages = crawlResults;
    console.log(`\n✅ Crawled ${pages.length} authenticated pages (${pages.filter(p => !p.error).length} successful)`);

    // Separate sanity checks by provider
    const cloudinarySanityChecks = [];
    const gtauSanityChecks = [];
    
    for (const page of crawlResults) {
      for (const u of page.dom.cloudinary.slice(0, 20)) {
        cloudinarySanityChecks.push({ provider: "Cloudinary", url: u });
      }
      for (const u of page.dom.gtauImages.slice(0, 20)) {
        gtauSanityChecks.push({ provider: "GTAU Images", url: u });
      }
    }

    // Run sanity checks for each provider
    console.log(`🔍 Running ${cloudinarySanityChecks.length} Cloudinary sanity checks...`);
    const cloudinarySanityResults = await Promise.all(
      cloudinarySanityChecks.map(async ({ provider, url }) => ({
        provider,
        ...(await httpSanity(url)),
      }))
    );
    
    console.log(`🔍 Running ${gtauSanityChecks.length} GTAU Images sanity checks...`);
    const gtauSanityResults = await Promise.all(
      gtauSanityChecks.map(async ({ provider, url }) => ({
        provider,
        ...(await httpSanity(url)),
      }))
    );
    console.log(`✅ Sanity checks completed\n`);

    const summaryRows = buildSummaryRows(pages);
    const cloudinarySanityRows = buildSanityRows(cloudinarySanityResults);
    const gtauSanityRows = buildSanityRows(gtauSanityResults);

    renderReport(
      path.join(__dirname, "template.html"),
      path.join(__dirname, "..", "report-auth.html"),
      {
        generatedAt: new Date().toISOString(),
        totalPages: pages.length,
        totalCloudReq: pages.reduce((a,p)=>a+p.reqCloudinary.length,0),
        totalGtauReq: pages.reduce((a,p)=>a+p.reqGtauImages.length,0),
        summaryRows,
        cloudinarySanityRows,
        gtauSanityRows
      }
    );

    console.log("✅ report-auth.html generated");
    
    await context.close();
  } finally {
    await browser.close();
    console.log("🔒 Browser closed");
  }
})();

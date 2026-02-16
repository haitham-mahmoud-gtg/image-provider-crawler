// src/index.js
const fs = require("fs");
const path = require("path");
const { crawlPage, createBrowser } = require("./crawler");
const { extractFromDOM } = require("./extractors");
const { httpSanity } = require("./httpSanity");
const { renderReport } = require("./reportRenderer");
const { buildSummaryRows, buildSanityRows } = require("./reportRows");

const urls = fs.readFileSync(path.join(__dirname, "..", "urls.txt"), "utf8")
  .split(/\r?\n/)
  .map(s => s.trim())
  .filter(Boolean);

(async () => {
  console.log(`🚀 Starting parallel crawl of ${urls.length} URLs...`);
  
  // Create a single browser instance for all pages
  const browser = await createBrowser();
  
  try {
    // Crawl all pages in parallel using the same browser
    const crawlResults = await Promise.all(
      urls.map(async (url) => {
        try {
          console.log(`📥 Crawling ${url}...`);
          const result = await crawlPage(url, browser);
          const dom = extractFromDOM(result.outerHTML);
          console.log(`✅ Completed ${url}`);
          
          return {
            url,
            domCloudinary: dom.cloudinary,
            domGtauImages: dom.gtauImages,
            reqCloudinary: result.network.cloudinary,
            reqGtauImages: result.network.gtauImages,
            dom, // Keep for sanity checks
            error: null,
          };
        } catch (error) {
          console.error(`❌ Failed ${url}: ${error.message}`);
          return {
            url,
            domCloudinary: [],
            domGtauImages: [],
            reqCloudinary: [],
            reqGtauImages: [],
            dom: { cloudinary: [], gtauImages: [] },
            error: error.message,
          };
        }
      })
    );

    const pages = crawlResults;
    console.log(`\n✅ Crawled ${pages.length} pages (${pages.filter(p => !p.error).length} successful)`);

    // Collect all sanity check URLs (cap per page)
    const sanityChecks = [];
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
      path.join(__dirname, "..", "report.html"),
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

    console.log("✅ report.html generated");
  } finally {
    await browser.close();
    console.log("🔒 Browser closed");
  }
})();

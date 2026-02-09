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
            domPeakHour: dom.peakhour,
            reqCloudinary: result.network.cloudinary,
            reqPeakHour: result.network.peakhour,
            dom, // Keep for sanity checks
            error: null,
          };
        } catch (error) {
          console.error(`❌ Failed ${url}: ${error.message}`);
          return {
            url,
            domCloudinary: [],
            domPeakHour: [],
            reqCloudinary: [],
            reqPeakHour: [],
            dom: { cloudinary: [], peakhour: [] },
            error: error.message,
          };
        }
      })
    );

    const pages = crawlResults;
    console.log(`\n✅ Crawled ${pages.length} pages (${pages.filter(p => !p.error).length} successful)`);

    // Collect all sanity check URLs (cap per page)
    const sanityChecks = [];
    for (const page of crawlResults) {
      for (const u of page.dom.cloudinary.slice(0, 20)) {
        sanityChecks.push({ provider: "Cloudinary", url: u });
      }
      for (const u of page.dom.peakhour.slice(0, 20)) {
        sanityChecks.push({ provider: "PeakHour", url: u });
      }
    }

    // Run all sanity checks in parallel
    console.log(`🔍 Running ${sanityChecks.length} HTTP sanity checks...`);
    const sanityResults = await Promise.all(
      sanityChecks.map(async ({ provider, url }) => ({
        provider,
        ...(await httpSanity(url)),
      }))
    );
    console.log(`✅ Sanity checks completed\n`);

  const summaryRows = buildSummaryRows(pages);
  const sanityRows = buildSanityRows(sanityResults);

  renderReport(
    path.join(__dirname, "template.html"),
    path.join(__dirname, "..", "report.html"),
    {
      generatedAt: new Date().toISOString(),
      totalPages: pages.length,
      totalCloudReq: pages.reduce((a,p)=>a+p.reqCloudinary.length,0),
      totalPeakReq: pages.reduce((a,p)=>a+p.reqPeakHour.length,0),
      summaryRows,
      sanityRows
    }
  );

    console.log("✅ report.html generated");
  } finally {
    await browser.close();
    console.log("🔒 Browser closed");
  }
})();

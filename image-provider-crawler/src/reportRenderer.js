// src/reportRenderer.js
const fs = require("fs");
const path = require("path");

function renderReport(templatePath, outputPath, data) {
  let html = fs.readFileSync(templatePath, "utf8");

  html = html
    .replace("{{GENERATED_AT}}", data.generatedAt)
    .replace("{{TOTAL_PAGES}}", data.totalPages)
    .replace("{{TOTAL_CLOUD_REQ}}", data.totalCloudReq)
    .replace("{{TOTAL_PEAK_REQ}}", data.totalPeakReq)
    .replace("{{SUMMARY_ROWS}}", data.summaryRows)
    .replace("{{SANITY_ROWS}}", data.sanityRows);

  fs.writeFileSync(outputPath, html, "utf8");
}

module.exports = { renderReport };

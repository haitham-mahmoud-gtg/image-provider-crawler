// src/reportBuilder.js

function buildReport(pages, sanityResults) {
  return {
    generatedAt: new Date().toISOString(),
    pages,
    sanityResults,
  };
}

module.exports = { buildReport };

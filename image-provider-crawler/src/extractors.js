// src/extractors.js

const CLOUDINARY_ANY = /https?:\/\/[^"'\s)]*cloudinary\.com\/[^"'\s)]+/gi;
const GTAU_IMAGES    = /https?:\/\/images\.[^"'\s)]*\.gtau\.net\/[^"'\s)]+/gi;

function uniqueMatches(text, regex) {
  const matches = text.match(regex) || [];
  // Clean up URLs: remove trailing quotes, %22, and other artifacts
  const cleaned = matches.map(url => {
    return url
      .replace(/["']+$/g, '')           // Remove trailing quotes
      .replace(/%22$/g, '')             // Remove trailing %22
      .replace(/\\["']/g, '')           // Remove escaped quotes
      .trim();
  });
  return [...new Set(cleaned)];
}

function extractFromDOM(outerHTML) {
  // Split into head and body sections
  const headMatch = outerHTML.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const bodyMatch = outerHTML.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  
  const headHTML = headMatch ? headMatch[1] : '';
  const bodyHTML = bodyMatch ? bodyMatch[1] : '';
  
  // Extract from header
  const headerCloudinary = uniqueMatches(headHTML, CLOUDINARY_ANY);
  const headerGtauImages = uniqueMatches(headHTML, GTAU_IMAGES);
  
  // Extract from body
  const bodyCloudinary = uniqueMatches(bodyHTML, CLOUDINARY_ANY);
  const bodyGtauImages = uniqueMatches(bodyHTML, GTAU_IMAGES);
  
  // Extract from entire DOM (for backward compatibility)
  const allCloudinary = uniqueMatches(outerHTML, CLOUDINARY_ANY);
  const allGtauImages = uniqueMatches(outerHTML, GTAU_IMAGES);
  
  return {
    cloudinary: allCloudinary,
    gtauImages: allGtauImages,
    header: {
      cloudinary: headerCloudinary,
      gtauImages: headerGtauImages,
    },
    body: {
      cloudinary: bodyCloudinary,
      gtauImages: bodyGtauImages,
    },
  };
}

module.exports = {
  extractFromDOM,
};

// src/extractors.js

const CLOUDINARY_ANY = /https?:\/\/[^"'\s)]*cloudinary\.com\/[^"'\s)]+/gi;
const PEAKHOUR_ANY   = /https?:\/\/[^"'\s)]*peakhour[^"'\s)]+/gi;

function uniqueMatches(text, regex) {
  return [...new Set(text.match(regex) || [])];
}

function extractFromDOM(outerHTML) {
  return {
    cloudinary: uniqueMatches(outerHTML, CLOUDINARY_ANY),
    peakhour:   uniqueMatches(outerHTML, PEAKHOUR_ANY),
  };
}

module.exports = {
  extractFromDOM,
};

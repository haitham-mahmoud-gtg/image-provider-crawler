// src/extractors.js

const CLOUDINARY_ANY = /https?:\/\/[^"'\s)]*cloudinary\.com\/[^"'\s)]+/gi;
const GTAU_IMAGES    = /https?:\/\/images\.[^"'\s)]*\.gtau\.net\/[^"'\s)]+/gi;

function uniqueMatches(text, regex) {
  return [...new Set(text.match(regex) || [])];
}

function extractFromDOM(outerHTML) {
  return {
    cloudinary: uniqueMatches(outerHTML, CLOUDINARY_ANY),
    gtauImages: uniqueMatches(outerHTML, GTAU_IMAGES),
  };
}

module.exports = {
  extractFromDOM,
};

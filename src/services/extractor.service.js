'use strict';

// URL pattern that matches common URLs in text messages
const URL_REGEX = /https?:\/\/[^\s<>"\])}]+/gi;

function extractUrls(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const matches = text.match(URL_REGEX);
  if (!matches) {
    return [];
  }

  // Deduplicate and clean URLs
  const seen = new Set();
  const urls = [];

  for (let url of matches) {
    // Remove trailing punctuation that is likely not part of the URL
    url = url.replace(/[.,;:!?)]+$/, '');

    if (!seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
  }

  return urls;
}

module.exports = { extractUrls };

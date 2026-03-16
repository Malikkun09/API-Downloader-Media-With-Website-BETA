'use strict';

const fs = require('fs');
const path = require('path');
const pino = require('pino');

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

function getCookiesDir() {
  return path.resolve(process.env.COOKIES_DIR || 'cookies');
}

function getCookiePath(cookieFile) {
  return path.join(getCookiesDir(), cookieFile);
}

function hasCookie(cookieFile) {
  try {
    const cookiePath = getCookiePath(cookieFile);
    return fs.existsSync(cookiePath);
  } catch {
    return false;
  }
}

function getCookie(cookieFile) {
  try {
    const cookiePath = getCookiePath(cookieFile);
    if (!fs.existsSync(cookiePath)) {
      logger.debug({ cookieFile }, 'Cookie file not found');
      return null;
    }

    const stat = fs.statSync(cookiePath);
    const ageHours = (Date.now() - stat.mtimeMs) / (1000 * 60 * 60);

    // Warn if cookie is older than 7 days
    if (ageHours > 168) {
      logger.warn({ cookieFile, ageHours: Math.round(ageHours) },
        'Cookie file may be expired');
    }

    return cookiePath;
  } catch (err) {
    logger.error({ cookieFile, error: err.message }, 'Error reading cookie');
    return null;
  }
}

module.exports = { hasCookie, getCookie, getCookiePath, getCookiesDir };

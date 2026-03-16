'use strict';

const VALID_API_KEYS = new Map();
let keysLoaded = false;

function loadApiKeys() {
  if (keysLoaded) return;

  const keys = {
    internal: process.env.API_KEY_INTERNAL,
    public: process.env.API_KEY_PUBLIC,
    development: process.env.API_KEY_DEVELOPMENT,
    production: process.env.API_KEY_PRODUCTION
  };

  const placeholders = ['your_internal_key', 'your_public_key', 'your_dev_key', 'your_production_key'];

  for (const [tier, key] of Object.entries(keys)) {
    if (key && !placeholders.includes(key)) {
      VALID_API_KEYS.set(key, tier);
    }
  }

  keysLoaded = true;
}

function authenticateApiKey(req, res, next) {
  loadApiKeys();

  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      status: false,
      error: 'API key is required. Use header: x-api-key'
    });
  }

  if (VALID_API_KEYS.size === 0) {
    return next();
  }

  if (!VALID_API_KEYS.has(apiKey)) {
    return res.status(403).json({
      status: false,
      error: 'Invalid API key'
    });
  }

  req.apiKeyTier = VALID_API_KEYS.get(apiKey);
  next();
}

module.exports = { authenticateApiKey };

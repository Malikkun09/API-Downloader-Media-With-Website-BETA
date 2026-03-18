import { logger } from '../services/logger.service.js';

const API_KEYS = {
  INTERNAL: process.env.API_KEY_INTERNAL,
  PUBLIC: process.env.API_KEY_PUBLIC,
  DEVELOPMENT: process.env.API_KEY_DEVELOPMENT,
  PRODUCTION: process.env.API_KEY_PRODUCTION
};

const TIER_PERMISSIONS = {
  INTERNAL: {
    download: true,
    batchLimit: 50,
    concurrentLimit: 10
  },
  PUBLIC: {
    download: true,
    batchLimit: 10,
    concurrentLimit: 3
  },
  DEVELOPMENT: {
    download: true,
    batchLimit: 20,
    concurrentLimit: 5
  },
  PRODUCTION: {
    download: true,
    batchLimit: 30,
    concurrentLimit: 5
  }
};

export const identifyTier = (apiKey) => {
  if (!apiKey) return null;
  
  for (const [tier, key] of Object.entries(API_KEYS)) {
    if (key && apiKey === key) {
      return tier;
    }
  }
  return null;
};

export const authMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    logger.warn({ ip: req.ip }, 'Missing API key');
    return res.status(401).json({
      status: false,
      message: 'API key required',
      hint: 'Add x-api-key header'
    });
  }

  const tier = identifyTier(apiKey);

  if (!tier) {
    logger.warn({ ip: req.ip, apiKey: apiKey.substring(0, 10) }, 'Invalid API key');
    return res.status(403).json({
      status: false,
      message: 'Invalid API key'
    });
  }

  req.apiTier = tier;
  req.permissions = TIER_PERMISSIONS[tier];
  
  logger.debug({ tier, ip: req.ip }, 'API access granted');
  
  next();
};

export const optionalAuthMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (apiKey) {
    const tier = identifyTier(apiKey);
    if (tier) {
      req.apiTier = tier;
      req.permissions = TIER_PERMISSIONS[tier];
    }
  }
  
  next();
};

export default authMiddleware;

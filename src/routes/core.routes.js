import express from 'express';
import os from 'os';
import { logger } from '../services/logger.service.js';
import { optionalAuthMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', optionalAuthMiddleware, (req, res) => {
  res.json({
    status: true,
    message: 'Media Downloader API v1.0',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    tier: req.apiTier || 'public'
  });
});

router.get('/health', (req, res) => {
  const memUsage = process.memoryUsage();
  const cpuLoad = os.loadavg();
  
  res.json({
    status: true,
    message: 'Media Downloader API is running',
    timestamp: new Date().toISOString(),
    system: {
      uptime: process.uptime(),
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB'
      },
      cpu: {
        load: cpuLoad.map(l => l.toFixed(2))
      }
    }
  });
});

router.get('/ping', (req, res) => {
  res.json({
    status: true,
    message: 'pong',
    timestamp: Date.now()
  });
});

export default router;

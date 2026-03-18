import express from 'express';
import coreRoutes from './core.routes.js';
import downloaderRoutes from './downloader.routes.js';
import { optionalAuthMiddleware } from '../middleware/auth.middleware.js';
import { platformService } from '../services/platform.service.js';
import fs from 'fs-extra';
import path from 'path';

const router = express.Router();

router.use('/health', coreRoutes);
router.use('/download', downloaderRoutes);

router.get('/platforms', optionalAuthMiddleware, async (req, res) => {
  try {
    const platforms = await platformService.getPlatforms();
    res.json({
      status: true,
      data: {
        platforms,
        total: platforms.length
      }
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Failed to get platforms',
      error: error.message
    });
  }
});

router.get('/info', optionalAuthMiddleware, (req, res) => {
  res.json({
    status: true,
    data: {
      name: 'Media Downloader API',
      version: '1.0.0',
      description: 'Professional REST API untuk download media dari berbagai platform',
      features: [
        '12 Platform Supported',
        'Multi-tier API Key',
        'Metadata Extraction',
        'Auto Cleanup',
        'Rate Limiting'
      ],
      tier: req.apiTier || 'public',
      permissions: req.permissions || {
        download: true,
        batchLimit: 5,
        concurrentLimit: 1
      }
    }
  });
});

export default router;

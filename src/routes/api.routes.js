'use strict';

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const { authenticateApiKey } = require('../middleware/auth.middleware');
const downloadController = require('../controllers/download.controller');
const platformService = require('../services/platform.service');

// Health check - no auth required
router.get('/health', (_req, res) => {
  res.json({
    status: true,
    message: 'Masukkan Nama Media Downloader API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      download: 'POST /api/download',
      fileAccess: 'GET /api/files/:filename',
      platforms: 'GET /api/platforms',
      health: 'GET /api/health'
    }
  });
});

// Protected endpoints
router.post('/download', authenticateApiKey, downloadController.download);

router.get('/platforms', authenticateApiKey, (_req, res) => {
  const platforms = platformService.getAllPlatforms();
  res.json({
    status: true,
    data: {
      platforms,
      total: platforms.length
    }
  });
});

router.get('/files/:filename', authenticateApiKey, (req, res) => {
  const filename = path.basename(req.params.filename);
  const downloadsDir = path.resolve(process.env.DOWNLOADS_DIR || 'downloads');
  const filePath = path.join(downloadsDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      status: false,
      error: 'File not found'
    });
  }

  res.sendFile(filePath);
});

module.exports = router;

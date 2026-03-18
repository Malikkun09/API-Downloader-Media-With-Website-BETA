import express from 'express';
import { optionalAuthMiddleware } from '../middleware/auth.middleware.js';
import { platformService } from '../services/platform.service.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.get('/', optionalAuthMiddleware, async (req, res) => {
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

router.get('/stats', async (req, res) => {
  try {
    const downloadsDir = process.env.DOWNLOADS_DIR || 'downloads';
    const cookiesDir = process.env.COOKIES_DIR || 'cookies';
    
    const downloadsExist = await fs.pathExists(downloadsDir);
    const cookiesExist = await fs.pathExists(cookiesDir);
    
    let downloadCount = 0;
    let totalSize = 0;
    
    if (downloadsExist) {
      const files = await fs.readdir(downloadsDir);
      downloadCount = files.filter(f => !f.startsWith('.')).length;
      
      for (const file of files) {
        const stat = await fs.stat(path.join(downloadsDir, file));
        totalSize += stat.size;
      }
    }
    
    let cookieCount = 0;
    if (cookiesExist) {
      const cookieFiles = await fs.readdir(cookiesDir);
      cookieCount = cookieFiles.filter(f => f.endsWith('.txt') || f.endsWith('.json')).length;
    }
    
    res.json({
      status: true,
      data: {
        downloads: {
          count: downloadCount,
          totalSize: totalSize,
          totalSizeFormatted: formatBytes(totalSize)
        },
        cookies: {
          count: cookieCount
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Failed to get stats',
      error: error.message
    });
  }
});

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default router;

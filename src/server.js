import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

import { logger } from './services/logger.service.js';
import apiRoutes from './routes/api.routes.js';
import { cleanupExpiredFiles } from './utils/cleanup.util.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    status: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

app.use('/api', apiRoutes);

app.use('/files', express.static(path.join(__dirname, '../downloads')));

app.get('/', (req, res) => {
  res.json({
    status: true,
    message: 'Media Downloader API v1.0',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      download: '/api/download',
      platforms: '/api/platforms',
      info: '/api/info'
    }
  });
});

app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    status: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({
    status: false,
    message: 'Endpoint not found'
  });
});

const startServer = async () => {
  try {
    await fs.ensureDir(process.env.DOWNLOADS_DIR || 'downloads');
    await fs.ensureDir(process.env.COOKIES_DIR || 'cookies');

    const cleanupInterval = parseInt(process.env.FILE_TTL_HOURS) || 24;
    const cleanupCron = `${Math.floor(Math.random() * 60)} ${Math.floor(Math.random() * 24)} * * *`;
    
    logger.info({ cleanupInterval, cleanupCron }, 'Auto cleanup scheduled');

    setInterval(async () => {
      try {
        await cleanupExpiredFiles();
      } catch (error) {
        logger.error({ error }, 'Cleanup error');
      }
    }, cleanupInterval * 60 * 60 * 1000);

    app.listen(PORT, () => {
      logger.info(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🎵 Media Downloader API v1.0                         ║
║                                                            ║
║   ✅ Server running on http://localhost:${PORT}            ║
║   ✅ Environment: ${process.env.NODE_ENV || 'development'}                         ║
║   ✅ Log Level: ${process.env.LOG_LEVEL || 'info'}                                ║
║                                                            ║
║   📋 Endpoints:                                            ║
║   - GET  /api/health                                       ║
║   - POST /api/download                                     ║
║   - GET  /api/platforms                                    ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
};

startServer();

export default app;

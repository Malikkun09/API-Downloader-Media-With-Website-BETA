'use strict';

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const pino = require('pino');

const apiRoutes = require('./routes/api.routes');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined
});

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;

const downloadsDir = path.resolve(process.env.DOWNLOADS_DIR || 'downloads');
const cookiesDir = path.resolve(process.env.COOKIES_DIR || 'cookies');

if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}
if (!fs.existsSync(cookiesDir)) {
  fs.mkdirSync(cookiesDir, { recursive: true });
}

app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: false,
    error: 'Too many requests, please try again later.'
  }
});
app.use(limiter);

app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url }, 'Incoming request');
  next();
});

app.use('/api', apiRoutes);

app.use((err, _req, res, _next) => {
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({
    status: false,
    error: 'Internal server error'
  });
});

// File cleanup based on TTL
const FILE_TTL_MS = (parseInt(process.env.FILE_TTL_HOURS, 10) || 24) * 60 * 60 * 1000;

function cleanupDownloads() {
  try {
    if (!fs.existsSync(downloadsDir)) return;
    const files = fs.readdirSync(downloadsDir);
    const now = Date.now();

    for (const file of files) {
      const filePath = path.join(downloadsDir, file);
      try {
        const stat = fs.statSync(filePath);
        if (now - stat.mtimeMs > FILE_TTL_MS) {
          fs.unlinkSync(filePath);
          logger.info({ file }, 'Cleaned up expired file');
        }
      } catch (e) {
        logger.warn({ file, error: e.message }, 'Failed to check/clean file');
      }
    }
  } catch (e) {
    logger.warn({ error: e.message }, 'Failed to run cleanup');
  }
}

// Run cleanup every hour
setInterval(cleanupDownloads, 60 * 60 * 1000);

app.listen(PORT, () => {
  logger.info(`Masukkan Nama Media Downloader API v1.0 running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  cleanupDownloads();
});

module.exports = app;

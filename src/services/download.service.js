'use strict';

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const pino = require('pino');

const cookieService = require('./cookie.service');
const ytdlpService = require('./ytdlp.service');

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

function getDownloadsDir() {
  return path.resolve(process.env.DOWNLOADS_DIR || 'downloads');
}

function getMimeType(ext) {
  const mimeTypes = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mkv': 'video/x-matroska',
    '.mp3': 'audio/mpeg',
    '.m4a': 'audio/mp4',
    '.ogg': 'audio/ogg',
    '.wav': 'audio/wav',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  };
  return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
}

function getFileType(ext) {
  const videoExts = ['.mp4', '.webm', '.mkv', '.avi', '.mov'];
  const audioExts = ['.mp3', '.m4a', '.ogg', '.wav', '.flac', '.aac'];
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];

  const lower = ext.toLowerCase();
  if (videoExts.includes(lower)) return 'video';
  if (audioExts.includes(lower)) return 'audio';
  if (imageExts.includes(lower)) return 'image';
  return 'other';
}

async function downloadMedia({ url, platform, quality, includeMetadata }) {
  const downloadsDir = getDownloadsDir();
  const fileId = uuidv4().split('-')[0];
  const outputTemplate = path.join(downloadsDir, `${fileId}_%(autonumber)s.%(ext)s`);

  // Get cookie if available
  const cookiePath = cookieService.getCookie(platform.cookieFile);
  if (platform.requiresCookie && !cookiePath) {
    logger.warn({ platform: platform.platform },
      'Cookie required but not found, proceeding without cookie');
  }

  let metadata = null;

  try {
    // Try to get metadata first
    if (includeMetadata) {
      try {
        metadata = await ytdlpService.getMetadata(url, cookiePath);
      } catch (err) {
        logger.warn({ url, error: err.message }, 'Failed to get metadata, continuing download');
      }
    }

    // Download the media
    await ytdlpService.downloadWithRetry({
      url,
      outputPath: outputTemplate,
      quality,
      cookiePath,
      includeMetadata: false
    });

    // Find downloaded files
    const files = findDownloadedFiles(downloadsDir, fileId);

    if (files.length === 0) {
      return {
        url,
        platform: platform.platform,
        platformName: platform.name,
        success: false,
        files: [],
        metadata,
        error: 'Download completed but no files found',
        partialSuccess: false
      };
    }

    return {
      url,
      platform: platform.platform,
      platformName: platform.name,
      success: true,
      files,
      metadata,
      error: null,
      partialSuccess: false
    };
  } catch (err) {
    logger.error({ url, platform: platform.platform, error: err.message }, 'Download failed');
    return {
      url,
      platform: platform.platform,
      platformName: platform.name,
      success: false,
      files: [],
      metadata,
      error: err.message,
      partialSuccess: false
    };
  }
}

function findDownloadedFiles(dir, fileId) {
  try {
    const allFiles = fs.readdirSync(dir);
    const matchingFiles = allFiles.filter(f => f.startsWith(fileId));

    return matchingFiles
      .filter(f => !f.endsWith('.json'))
      .map(filename => {
        const filePath = path.join(dir, filename);
        const stat = fs.statSync(filePath);
        const ext = path.extname(filename);

        return {
          filename,
          path: `/api/files/${filename}`,
          size_bytes: stat.size,
          mime: getMimeType(ext),
          type: getFileType(ext)
        };
      });
  } catch {
    return [];
  }
}

module.exports = { downloadMedia };

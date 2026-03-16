'use strict';

const { execFile } = require('child_process');
const path = require('path');
const pino = require('pino');

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const DOWNLOAD_TIMEOUT_MS = parseInt(process.env.DOWNLOAD_TIMEOUT_MS, 10) || 300000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function buildYtdlpArgs({ url, outputPath, quality = 'best', cookiePath = null, includeMetadata = false }) {
  const args = [];

  // Output template
  args.push('-o', outputPath);

  // Quality/format selection
  switch (quality) {
    case 'best':
      args.push('-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best');
      break;
    case 'worst':
      args.push('-f', 'worstvideo+worstaudio/worst');
      break;
    case '720':
      args.push('-f', 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best');
      break;
    case '480':
      args.push('-f', 'bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480][ext=mp4]/best');
      break;
    case '360':
      args.push('-f', 'bestvideo[height<=360][ext=mp4]+bestaudio[ext=m4a]/best[height<=360][ext=mp4]/best');
      break;
    default:
      args.push('-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best');
  }

  // Cookie
  if (cookiePath) {
    args.push('--cookies', cookiePath);
  }

  // Metadata
  if (includeMetadata) {
    args.push('--write-info-json');
  }

  // General options
  args.push('--no-playlist');
  args.push('--no-warnings');
  args.push('--no-check-certificates');
  args.push('--prefer-free-formats');
  args.push('--merge-output-format', 'mp4');

  // URL last
  args.push(url);

  return args;
}

function runYtdlp(args) {
  return new Promise((resolve, reject) => {
    execFile('yt-dlp', args, { timeout: DOWNLOAD_TIMEOUT_MS }, (error, stdout, stderr) => {
      if (error) {
        const message = stderr || error.message;
        reject(new Error(`yt-dlp error: ${message}`));
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

function getMetadata(url, cookiePath = null) {
  return new Promise((resolve, reject) => {
    const args = ['--dump-json', '--no-download', '--no-warnings'];
    if (cookiePath) {
      args.push('--cookies', cookiePath);
    }
    args.push(url);

    execFile('yt-dlp', args, { timeout: 60000 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Metadata error: ${stderr || error.message}`));
      } else {
        try {
          const data = JSON.parse(stdout);
          resolve({
            title: data.title || null,
            duration: data.duration || null,
            uploader: data.uploader || data.channel || null,
            view_count: data.view_count || null,
            description: data.description ? data.description.substring(0, 500) : null,
            thumbnail: data.thumbnail || null
          });
        } catch (parseErr) {
          logger.warn({ error: parseErr.message }, 'Failed to parse yt-dlp metadata JSON');
          resolve(null);
        }
      }
    });
  });
}

async function downloadWithRetry({ url, outputPath, quality, cookiePath, includeMetadata }) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger.info({ url, attempt }, 'Attempting download');
      const args = buildYtdlpArgs({ url, outputPath, quality, cookiePath, includeMetadata });
      await runYtdlp(args);
      return true;
    } catch (err) {
      lastError = err;
      logger.warn({ url, attempt, error: err.message }, 'Download attempt failed');
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw lastError;
}

module.exports = { downloadWithRetry, getMetadata, buildYtdlpArgs };

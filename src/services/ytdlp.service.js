import pkg from 'yt-dlp-exec';
const { exec } = pkg;
import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger.service.js';
import { cookieService } from './cookie.service.js';
import { extractorService } from './extractor.service.js';

const downloadsDir = process.env.DOWNLOADS_DIR || 'downloads';

export const ytdlpService = {
  download: async (url, options = {}) => {
    try {
      const { quality = 'best', platform } = options;
      
      await fs.ensureDir(downloadsDir);
      
      const outputTemplate = path.join(downloadsDir, '%(id)s_%(playlist_index)s.%(ext)s');
      
      let ytdlpOptions = {
        output: outputTemplate,
        'no-check-certificate': true,
        'no-warnings': true,
        format: ytdlpService.getFormat(quality),
        'merge-output-format': 'mp4',
        retries: 3,
        'fragment-retries': 3,
        'socket-timeout': 300
      };
      
      const cookiePath = await cookieService.getCookiePath(platform);
      if (cookiePath) {
        ytdlpOptions.cookies = cookiePath;
      }
      
      logger.info({ url, quality, platform }, 'Starting yt-dlp metadata extraction');
      
      let parsedInfo = null;
      try {
        const dumpOptions = {
          'dump-single-json': true,
          'no-warnings': true,
          'no-check-certificates': true
        };
        if (ytdlpOptions.cookies) dumpOptions.cookies = ytdlpOptions.cookies;
        
        let execResult = await exec(url, dumpOptions);
        if (execResult && execResult.stdout) {
          try {
            parsedInfo = JSON.parse(execResult.stdout);
          } catch(e) {
            logger.error({ error: e.message }, 'Failed to parse yt-dlp stdout as JSON');
          }
        }
      } catch (err) {
        logger.warn({ url, error: err.message }, 'Failed to extract metadata, will continue download anyway');
      }

      logger.info({ url, quality, platform }, 'Starting yt-dlp download');
      
      await exec(url, ytdlpOptions);
      
      const files = await ytdlpService.findDownloadedFiles(url);
      
      const metadata = extractorService.extractMetadata(parsedInfo || {});
      
      return {
        success: files.length > 0,
        files,
        metadata,
        error: files.length === 0 ? 'No files were downloaded' : null,
        partialSuccess: false
      };
      
    } catch (error) {
      logger.error({ url, error: error.message }, 'yt-dlp download error');
      
      const files = await ytdlpService.findDownloadedFiles(url);
      
      if (files.length > 0) {
        return {
          success: false,
          files,
          metadata: null,
          error: error.message,
          partialSuccess: true
        };
      }
      
      return {
        success: false,
        files: [],
        metadata: null,
        error: error.message,
        partialSuccess: false
      };
    }
  },
  
  getFormat: (quality) => {
    const formatMap = {
      'best': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
      'worst': 'worstvideo[ext=mp4]+worstaudio[ext=m4a]/worst[ext=mp4]/worst',
      '2160': 'bestvideo[height<=2160][ext=mp4]+bestaudio[ext=m4a]/best[height<=2160][ext=mp4]/best',
      '1440': 'bestvideo[height<=1440][ext=mp4]+bestaudio[ext=m4a]/best[height<=1440][ext=mp4]/best',
      '1080': 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best',
      '720': 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best',
      '480': 'bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480][ext=mp4]/best',
      '360': 'bestvideo[height<=360][ext=mp4]+bestaudio[ext=m4a]/best[height<=360][ext=mp4]/best',
      'auto': 'best'
    };
    
    return formatMap[quality] || formatMap.best;
  },
  
  findDownloadedFiles: async (url) => {
    try {
      const files = await fs.readdir(downloadsDir);
      const urlHash = ytdlpService.getUrlHash(url);
      
      const downloadedFiles = [];
      
      for (const file of files) {
        if (file.startsWith('.') || !file.includes('_')) continue;
        
        const filePath = path.join(downloadsDir, file);
        const stat = await fs.stat(filePath);
        
        if (stat.isFile()) {
          const ext = path.extname(file).toLowerCase();
          const validExtensions = ['.mp4', '.webm', '.mkv', '.mp3', '.m4a', '.jpg', '.jpeg', '.png', '.gif', '.webp'];
          
          if (validExtensions.includes(ext)) {
            downloadedFiles.push({
              filename: file,
              path: `/files/${file}`,
              url: `http://localhost:${process.env.PORT || 3000}/files/${file}`,
              size_bytes: stat.size,
              mime: ytdlpService.getMimeType(ext),
              type: ytdlpService.getMediaType(ext)
            });
          }
        }
      }
      
      return downloadedFiles;
    } catch (error) {
      logger.error({ error: error.message }, 'Error finding downloaded files');
      return [];
    }
  },
  
  getUrlHash: (url) => {
    let hash = '';
    if (url.includes('youtu')) {
      const match = url.match(/(?:watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
      if (match) hash = match[1];
    }
    return hash;
  },
  
  getMimeType: (ext) => {
    const mimeTypes = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mkv': 'video/x-matroska',
      '.mp3': 'audio/mpeg',
      '.m4a': 'audio/mp4',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  },
  
  getMediaType: (ext) => {
    const videoExts = ['.mp4', '.webm', '.mkv'];
    const audioExts = ['.mp3', '.m4a'];
    
    if (videoExts.includes(ext)) return 'video';
    if (audioExts.includes(ext)) return 'audio';
    return 'image';
  }
};

export default ytdlpService;

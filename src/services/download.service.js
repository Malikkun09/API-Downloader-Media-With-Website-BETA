import { platformService } from './platform.service.js';
import { ytdlpService } from './ytdlp.service.js';
import { logger } from './logger.service.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs-extra';

export const downloadService = {
  processUrls: async (urls, options) => {
    const results = [];
    
    for (const url of urls) {
      try {
        const result = await downloadService.downloadSingle(url, options);
        results.push(result);
      } catch (error) {
        logger.error({ url, error: error.message }, 'Download failed for URL');
        results.push({
          url,
          platform: platformService.detectPlatform(url),
          success: false,
          files: [],
          error: error.message,
          partialSuccess: false
        });
      }
    }
    
    return results;
  },
  
  downloadSingle: async (url, options) => {
    const platform = options.platform || platformService.detectPlatform(url);
    const platformInfo = platformService.getPlatformInfo(platform);
    
    logger.info({ url, platform }, 'Processing download');
    
    let result;
    
    switch (platform) {
      case 'youtube':
      case 'youtubemusic':
      case 'tiktok':
      case 'twitter':
      case 'facebook':
      case 'instagram':
      case 'reddit':
      case 'pinterest':
      case 'threads':
      case 'fandom':
      case 'pixiv':
        result = await ytdlpService.download(url, options);
        break;
      default:
        result = await ytdlpService.download(url, options);
    }
    
    return {
      url,
      platform,
      platformName: platformInfo?.name || platform,
      success: result.success,
      files: result.files || [],
      metadata: options.includeMetadata ? result.metadata : undefined,
      error: result.error,
      partialSuccess: result.partialSuccess || false
    };
  }
};

export default downloadService;

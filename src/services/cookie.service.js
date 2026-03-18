import fs from 'fs-extra';
import path from 'path';
import { logger } from './logger.service.js';

const cookiesDir = process.env.COOKIES_DIR || 'cookies';

export const cookieService = {
  getCookiePath: async (platform) => {
    if (!platform) return null;
    
    const cookieFile = path.join(cookiesDir, `${platform}.txt`);
    
    const exists = await fs.pathExists(cookieFile);
    
    if (exists) {
      logger.info({ platform, cookieFile }, 'Using cookie file');
      return cookieFile;
    }
    
    logger.warn({ platform }, 'Cookie file not found');
    return null;
  },
  
  getAvailableCookies: async () => {
    await fs.ensureDir(cookiesDir);
    
    const files = await fs.readdir(cookiesDir);
    const cookies = files
      .filter(f => f.endsWith('.txt'))
      .map(f => f.replace('.txt', ''));
    
    return cookies;
  },
  
  validateCookie: async (platform) => {
    const cookiePath = await cookieService.getCookiePath(platform);
    
    if (!cookiePath) {
      return {
        available: false,
        message: `Cookie file for ${platform} not found`
      };
    }
    
    try {
      const content = await fs.readFile(cookiePath, 'utf-8');
      const hasValidFormat = content.includes('# Netscape HTTP Cookie File') || 
                             content.includes('localhost');
      
      return {
        available: true,
        valid: hasValidFormat,
        message: hasValidFormat ? 'Cookie file is valid' : 'Cookie file format may be invalid'
      };
    } catch (error) {
      return {
        available: false,
        message: error.message
      };
    }
  }
};

export default cookieService;

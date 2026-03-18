import fs from 'fs-extra';
import path from 'path';
import { logger } from '../services/logger.service.js';

const downloadsDir = process.env.DOWNLOADS_DIR || 'downloads';
const ttlHours = parseInt(process.env.FILE_TTL_HOURS) || 24;

export const cleanupExpiredFiles = async () => {
  try {
    const exists = await fs.pathExists(downloadsDir);
    if (!exists) {
      logger.info('Downloads directory does not exist, skipping cleanup');
      return { deleted: 0, errors: 0 };
    }
    
    const files = await fs.readdir(downloadsDir);
    const now = Date.now();
    const ttlMs = ttlHours * 60 * 60 * 1000;
    
    let deleted = 0;
    let errors = 0;
    
    for (const file of files) {
      if (file.startsWith('.')) continue;
      
      const filePath = path.join(downloadsDir, file);
      
      try {
        const stat = await fs.stat(filePath);
        const age = now - stat.mtimeMs;
        
        if (age > ttlMs) {
          await fs.remove(filePath);
          deleted++;
          logger.debug({ file, age: Math.round(age / 1000 / 60) + ' min' }, 'Deleted expired file');
        }
      } catch (error) {
        errors++;
        logger.error({ file, error: error.message }, 'Error processing file');
      }
    }
    
    logger.info({ deleted, errors, ttlHours }, 'Cleanup completed');
    return { deleted, errors };
  } catch (error) {
    logger.error({ error: error.message }, 'Cleanup failed');
    return { deleted: 0, errors: 1 };
  }
};

export default cleanupExpiredFiles;

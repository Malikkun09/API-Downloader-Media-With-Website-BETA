import { downloadService } from '../services/download.service.js';
import { logger } from '../services/logger.service.js';

export const downloadController = {
  handleDownload: async (req, res) => {
    try {
      const { text, url, quality, includeMetadata, platform } = req.body;
      
      let urls = [];
      
      if (url) {
        urls = [url];
      } else if (text) {
        urls = extractUrls(text);
      } else {
        return res.status(400).json({
          status: false,
          message: 'Either url or text parameter is required'
        });
      }
      
      if (urls.length === 0) {
        return res.status(400).json({
          status: false,
          message: 'No valid URLs found in request'
        });
      }
      
      const batchLimit = req.permissions?.batchLimit || 5;
      if (urls.length > batchLimit) {
        return res.status(400).json({
          status: false,
          message: `Maximum ${batchLimit} URLs allowed per request`
        });
      }
      
      const options = {
        quality: quality || 'best',
        includeMetadata: includeMetadata !== false,
        platform: platform,
        tier: req.apiTier
      };
      
      logger.info({ 
        urls: urls.length, 
        quality: options.quality,
        tier: req.apiTier 
      }, 'Starting download batch');
      
      const results = await downloadService.processUrls(urls, options);
      
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      const totalFiles = results.reduce((sum, r) => sum + (r.files?.length || 0), 0);
      
      const response = {
        status: true,
        message: failed === 0 
          ? 'Download completed successfully' 
          : 'Download completed with some errors',
        data: {
          urlsProcessed: urls.length,
          successful,
          failed,
          totalFiles,
          results
        },
        summary: {
          total: urls.length,
          success: successful,
          errors: failed,
          totalFiles
        }
      };
      
      if (failed > 0 && successful === 0) {
        response.status = false;
        response.message = 'All downloads failed';
      }
      
      res.json(response);
      
    } catch (error) {
      logger.error({ error: error.message }, 'Download controller error');
      res.status(500).json({
        status: false,
        message: 'Download failed',
        error: error.message
      });
    }
  }
};

function extractUrls(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  return matches ? [...new Set(matches)] : [];
}

export default downloadController;

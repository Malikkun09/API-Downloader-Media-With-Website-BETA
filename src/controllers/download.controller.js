'use strict';

const pino = require('pino');
const extractorService = require('../services/extractor.service');
const platformService = require('../services/platform.service');
const downloadService = require('../services/download.service');

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const VALID_QUALITIES = ['best', 'worst', '720', '480', '360'];

async function download(req, res) {
  try {
    const { text, quality = 'best', includeMetadata = true } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        status: false,
        error: 'Field "text" is required and must be a non-empty string'
      });
    }

    if (!VALID_QUALITIES.includes(quality)) {
      return res.status(400).json({
        status: false,
        error: `Invalid quality. Valid options: ${VALID_QUALITIES.join(', ')}`
      });
    }

    const urls = extractorService.extractUrls(text);

    if (urls.length === 0) {
      return res.status(400).json({
        status: false,
        error: 'No valid URLs found in text'
      });
    }

    const results = [];
    let successful = 0;
    let failed = 0;
    let totalFiles = 0;

    for (const url of urls) {
      try {
        const platform = platformService.detectPlatform(url);

        if (!platform) {
          results.push({
            url,
            platform: null,
            platformName: null,
            success: false,
            files: [],
            metadata: null,
            error: 'Unsupported platform',
            partialSuccess: false
          });
          failed++;
          continue;
        }

        const result = await downloadService.downloadMedia({
          url,
          platform,
          quality,
          includeMetadata
        });

        results.push(result);

        if (result.success) {
          successful++;
          totalFiles += result.files.length;
        } else {
          failed++;
        }
      } catch (err) {
        logger.error({ url, error: err.message }, 'Download failed for URL');
        results.push({
          url,
          platform: null,
          platformName: null,
          success: false,
          files: [],
          metadata: null,
          error: err.message,
          partialSuccess: false
        });
        failed++;
      }
    }

    res.json({
      status: true,
      message: failed === 0 ? 'Download completed successfully' : 'Download completed with some errors',
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
    });
  } catch (err) {
    logger.error({ error: err.message }, 'Unexpected error in download controller');
    res.status(500).json({
      status: false,
      error: 'Internal server error during download'
    });
  }
}

module.exports = { download };

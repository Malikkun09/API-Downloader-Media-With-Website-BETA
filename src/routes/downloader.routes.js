import express from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { downloadController } from '../controllers/download.controller.js';

const router = express.Router();

const downloadValidation = [
  body('text')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Text must be a non-empty string'),
  body('url')
    .optional()
    .isURL()
    .withMessage('Invalid URL format'),
  body('quality')
    .optional()
    .isIn(['best', 'worst', '2160', '1440', '1080', '720', '480', '360', 'auto'])
    .withMessage('Invalid quality option'),
  body('includeMetadata')
    .optional()
    .isBoolean()
    .withMessage('includeMetadata must be a boolean'),
  body('platform')
    .optional()
    .isString()
    .trim()
];

router.post('/', 
  authMiddleware,
  downloadValidation,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }
    next();
  },
  downloadController.handleDownload
);

export default router;

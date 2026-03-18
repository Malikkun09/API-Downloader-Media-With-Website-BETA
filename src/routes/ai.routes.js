import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { aiService } from '../services/ai.service.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  res.json({
    status: true,
    message: 'AI Features Endpoint',
    features: {
      summarize: 'Summarize text or metadata',
      extract: 'Extract information from text',
      tags: 'Generate tags for content'
    }
  });
});

router.post('/summarize', authMiddleware, async (req, res) => {
  try {
    const { text, maxLength } = req.body;
    
    if (!text) {
      return res.status(400).json({
        status: false,
        message: 'Text is required'
      });
    }
    
    const summary = await aiService.summarize(text, maxLength);
    
    res.json({
      status: true,
      data: {
        summary
      }
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Failed to generate summary',
      error: error.message
    });
  }
});

router.post('/tags', authMiddleware, async (req, res) => {
  try {
    const { title, description } = req.body;
    
    if (!title) {
      return res.status(400).json({
        status: false,
        message: 'Title is required'
      });
    }
    
    const tags = await aiService.generateTags(title, description);
    
    res.json({
      status: true,
      data: {
        tags
      }
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Failed to generate tags',
      error: error.message
    });
  }
});

export default router;

import { logger } from './logger.service.js';

export const aiService = {
  summarize: async (text, maxLength = 200) => {
    try {
      if (!text || text.length < 10) {
        return text;
      }
      
      const words = text.split(/\s+/);
      let summary = '';
      const targetLength = maxLength || 200;
      
      for (const word of words) {
        if ((summary + ' ' + word).length <= targetLength) {
          summary += (summary ? ' ' : '') + word;
        } else {
          break;
        }
      }
      
      if (text.length > targetLength) {
        summary += '...';
      }
      
      return summary;
    } catch (error) {
      logger.error({ error: error.message }, 'AI summarize error');
      return text;
    }
  },
  
  generateTags: async (title, description) => {
    try {
      const tags = new Set();
      
      if (title) {
        const titleWords = title
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter(w => w.length > 2);
        
        titleWords.forEach(w => tags.add(w));
      }
      
      if (description) {
        const descWords = description
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter(w => w.length > 3);
        
        descWords.slice(0, 5).forEach(w => tags.add(w));
      }
      
      const commonWords = ['the', 'and', 'for', 'with', 'this', 'that', 'from', 'have', 'will', 'your'];
      commonWords.forEach(w => tags.delete(w));
      
      return Array.from(tags).slice(0, 10);
    } catch (error) {
      logger.error({ error: error.message }, 'AI generateTags error');
      return [];
    }
  },
  
  extractKeywords: async (text) => {
    try {
      const words = text
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3);
      
      const wordCount = {};
      words.forEach(w => {
        wordCount[w] = (wordCount[w] || 0) + 1;
      });
      
      const sorted = Object.entries(wordCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word]) => word);
      
      return sorted;
    } catch (error) {
      logger.error({ error: error.message }, 'AI extractKeywords error');
      return [];
    }
  }
};

export default aiService;

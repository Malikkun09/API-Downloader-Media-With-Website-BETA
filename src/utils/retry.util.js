import { logger } from '../services/logger.service.js';

export const retry = async (fn, options = {}) => {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = 2,
    onRetry = null
  } = options;
  
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      logger.warn({ 
        attempt, 
        maxRetries, 
        error: error.message 
      }, 'Retry attempt failed');
      
      if (onRetry) {
        onRetry(error, attempt);
      }
      
      if (attempt < maxRetries) {
        const waitTime = delay * Math.pow(backoff, attempt - 1);
        await sleep(waitTime);
      }
    }
  }
  
  throw lastError;
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const retryWithTimeout = async (fn, timeoutMs = 30000) => {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
  });
  
  return Promise.race([fn(), timeoutPromise]);
};

export default retry;

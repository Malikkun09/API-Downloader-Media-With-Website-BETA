export const errorClassifier = {
  classify: (error) => {
    const errorMessage = (error.message || error.toString()).toLowerCase();
    
    if (isAuthError(errorMessage)) {
      return {
        type: 'AUTH',
        severity: 'high',
        retryable: false,
        message: 'Authentication required',
        suggestion: 'Add valid cookies for this platform'
      };
    }
    
    if (isPrivateError(errorMessage)) {
      return {
        type: 'PRIVATE',
        severity: 'high',
        retryable: false,
        message: 'Content is private or unavailable',
        suggestion: 'Content may require login or be deleted'
      };
    }
    
    if (isNotFoundError(errorMessage)) {
      return {
        type: 'NOT_FOUND',
        severity: 'high',
        retryable: false,
        message: 'Content not found',
        suggestion: 'URL may be incorrect or content has been removed'
      };
    }
    
    if (isRateLimitError(errorMessage)) {
      return {
        type: 'RATE_LIMIT',
        severity: 'medium',
        retryable: true,
        message: 'Rate limit exceeded',
        suggestion: 'Wait a moment and try again'
      };
    }
    
    if (isNetworkError(errorMessage)) {
      return {
        type: 'NETWORK',
        severity: 'medium',
        retryable: true,
        message: 'Network error',
        suggestion: 'Check your internet connection'
      };
    }
    
    if (isGeoBlockError(errorMessage)) {
      return {
        type: 'GEOBLOCK',
        severity: 'high',
        retryable: false,
        message: 'Content is geo-blocked',
        suggestion: 'Try using a proxy from an allowed region'
      };
    }
    
    if (isQuotaError(errorMessage)) {
      return {
        type: 'QUOTA',
        severity: 'high',
        retryable: false,
        message: 'API quota exceeded',
        suggestion: 'Wait for quota reset or upgrade plan'
      };
    }
    
    return {
      type: 'UNKNOWN',
      severity: 'medium',
      retryable: true,
      message: error.message || 'Unknown error',
      suggestion: 'Try again later'
    };
  },
  
  getCommonErrors: () => {
    return [
      {
        error: 'HTTP Error 403: Forbidden',
        type: 'AUTH',
        solution: 'Add valid cookies for this platform'
      },
      {
        error: 'Video unavailable',
        type: 'PRIVATE',
        solution: 'Content may be private or deleted'
      },
      {
        error: 'Unable to download',
        type: 'NETWORK',
        solution: 'Check internet connection'
      }
    ];
  }
};

function isAuthError(message) {
  const authPatterns = [
    'login', 'sign in', 'authentication', 'unauthorized',
    'http error 401', '403 forbidden', 'account is private',
    'this account is private', 'cookie', 'credentials'
  ];
  return authPatterns.some(p => message.includes(p));
}

function isPrivateError(message) {
  const privatePatterns = [
    'private', 'unavailable', 'not available', 'removed',
    'deleted', 'disabled', 'this video has been removed',
    'video unavailable', 'content not found'
  ];
  return privatePatterns.some(p => message.includes(p));
}

function isNotFoundError(message) {
  const notFoundPatterns = [
    '404', 'not found', 'does not exist', 'invalid url',
    'no such', 'cannot find'
  ];
  return notFoundPatterns.some(p => message.includes(p));
}

function isRateLimitError(message) {
  const rateLimitPatterns = [
    'rate limit', 'too many requests', '429', 'throttl',
    'slow down', 'please wait'
  ];
  return rateLimitPatterns.some(p => message.includes(p));
}

function isNetworkError(message) {
  const networkPatterns = [
    'connection', 'network', 'timeout', 'econnrefused',
    'enetunreach', 'eai_fail', 'dns', 'fetch failed'
  ];
  return networkPatterns.some(p => message.includes(p));
}

function isGeoBlockError(message) {
  const geoPatterns = [
    'geo', 'not available in your country', 'blocked in your',
    'this content is not available', 'copyright', 'region'
  ];
  return geoPatterns.some(p => message.includes(p));
}

function isQuotaError(message) {
  const quotaPatterns = [
    'quota', 'exceeded', 'limit reached', 'daily limit',
    'monthly limit', 'premium', 'subscription required'
  ];
  return quotaPatterns.some(p => message.includes(p));
}

export default errorClassifier;

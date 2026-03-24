/**
 * Rate limiting middleware for API endpoints
 * Implements in-memory rate limiting with configurable windows
 */

const rateLimitStore = new Map();

/**
 * Clean up old entries from the rate limit store
 */
function cleanupStore() {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupStore, 5 * 60 * 1000);

/**
 * Create a rate limiter middleware
 * @param {Object} options - Rate limiter options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum number of requests per window
 * @param {string} options.message - Error message to send when limit is exceeded
 * @returns {Function} Express middleware function
 */
export function createRateLimiter({ windowMs = 60000, max = 100, message = 'Too many requests' } = {}) {
  return (req, res, next) => {
    // Use IP address as the key (consider using user ID for authenticated routes)
    const identifier = req.ip || req.connection.remoteAddress || 'unknown';
    const key = `${identifier}:${req.path}`;
    const now = Date.now();

    let record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      // Create new record
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(key, record);
      return next();
    }

    if (record.count >= max) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      res.set('X-RateLimit-Limit', String(max));
      res.set('X-RateLimit-Remaining', '0');
      res.set('X-RateLimit-Reset', String(record.resetTime));
      return res.status(429).json({ error: message });
    }

    // Increment count
    record.count++;
    res.set('X-RateLimit-Limit', String(max));
    res.set('X-RateLimit-Remaining', String(max - record.count));
    res.set('X-RateLimit-Reset', String(record.resetTime));
    
    next();
  };
}

/**
 * Strict rate limiter for sensitive endpoints (e.g., checkout, auth)
 */
export const strictRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes
  message: 'Too many requests from this IP, please try again later',
});

/**
 * Standard rate limiter for general API endpoints
 */
export const standardRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Rate limit exceeded, please slow down',
});

/**
 * Lenient rate limiter for public read-only endpoints
 */
export const lenientRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Rate limit exceeded',
});

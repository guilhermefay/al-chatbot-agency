const rateLimit = require('express-rate-limit');

const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests') => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: message,
      resetTime: new Date(Date.now() + windowMs)
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Default rate limiter for API routes
const defaultLimiter = createRateLimiter(
  process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  process.env.RATE_LIMIT_MAX_REQUESTS || 100,
  'Too many requests from this IP, please try again later'
);

// Stricter limiter for sensitive operations
const strictLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  10, // 10 requests max
  'Too many sensitive operations, please try again later'
);

// Webhook specific limiter (more permissive)
const webhookLimiter = createRateLimiter(
  1 * 60 * 1000, // 1 minute
  1000, // 1000 requests max
  'Webhook rate limit exceeded'
);

module.exports = {
  defaultLimiter,
  strictLimiter,
  webhookLimiter,
  createRateLimiter
};
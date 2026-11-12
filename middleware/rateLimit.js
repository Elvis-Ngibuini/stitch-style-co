const rateLimit = require('express-rate-limit');

const createRateLimiter = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { message },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ message });
  }
});

const authLimiter = createRateLimiter(
  15 * 60 * 1000,
  10,
  'Too many authentication attempts, please try again later'
);

const apiLimiter = createRateLimiter(
  15 * 60 * 1000,
  100,
  'Too many requests, please try again later'
);

const strictApiLimiter = createRateLimiter(
  60 * 1000,
  30,
  'Too many requests, please slow down'
);

const webhookLimiter = createRateLimiter(
  60 * 1000,
  50,
  'Too many webhook requests'
);

module.exports = {
  authLimiter,
  apiLimiter,
  strictApiLimiter,
  webhookLimiter
};
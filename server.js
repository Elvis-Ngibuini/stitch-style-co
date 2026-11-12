require('dotenv').config({ path: require('path').join(__dirname, '.env') });
console.log('✅ dotenv loaded');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

const express = require('express');
console.log('✅ express loaded');
const cors = require('cors');
console.log('✅ cors loaded');
const helmet = require('helmet');
console.log('✅ helmet loaded');
const cookieParser = require('cookie-parser');
console.log('✅ cookieParser loaded');
const connectDB = require('./config/db');
console.log('✅ connectDB loaded');
const env = require('./config/env');
console.log('✅ env loaded:', env.NODE_ENV);
const { notFound, errorHandler } = require('./middleware/error');
console.log('✅ error middleware loaded');
const { authLimiter, apiLimiter, strictApiLimiter, webhookLimiter } = require('./middleware/rateLimit');
console.log('✅ rateLimit loaded');

console.log('Connecting to DB...');
connectDB();

console.log('Creating express app...');
const app = express();

const isProduction = env.NODE_ENV === 'production';
const frontendUrl = env.FRONTEND_URL;

app.use(helmet({
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      fontSrc: ["'self'"],
      connectSrc: ["'self'", frontendUrl],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  } : false,
  crossOriginEmbedderPolicy: false,
  hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  noSniff: true,
  xssFilter: true,
  frameguard: { action: 'deny' }
}));

app.use(cors({
  origin: isProduction ? frontendUrl : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400
}));

app.use(express.json({ limit: '10kb', strict: true }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

app.use('/api/orders/webhook', express.raw({ type: 'application/json', limit: '1mb' }), webhookLimiter);

app.use('/api/auth', authLimiter);
app.use('/api/', apiLimiter);
app.use('/api/admin', strictApiLimiter);

console.log('Loading routes...');
app.use('/api/auth', require('./routes/authRoutes'));
console.log('✅ authRoutes loaded');
app.use('/api/products', require('./routes/productRoutes'));
console.log('✅ productRoutes loaded');
app.use('/api/categories', require('./routes/categoryRoutes'));
console.log('✅ categoryRoutes loaded');
app.use('/api/cart', require('./routes/cartRoutes'));
console.log('✅ cartRoutes loaded');
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
console.log('✅ wishlistRoutes loaded');
app.use('/api/orders', require('./routes/orderRoutes'));
console.log('✅ orderRoutes loaded');
app.use('/api/reviews', require('./routes/reviewRoutes'));
console.log('✅ reviewRoutes loaded');
app.use('/api/coupons', require('./routes/couponRoutes'));
console.log('✅ couponRoutes loaded');
app.use('/api/admin', require('./routes/adminRoutes'));
console.log('✅ adminRoutes loaded');

app.use(notFound);
app.use(errorHandler);

const PORT = env.PORT;
console.log('Starting server on port:', PORT);
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...', err.name, err.message);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...', err.name, err.message);
  process.exit(1);
});

module.exports = app;
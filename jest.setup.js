process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-min-32-characters-long';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-min-32-characters-long';
process.env.JWT_EXPIRE = '15m';
process.env.JWT_REFRESH_EXPIRE = '7d';
process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_fake';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_fake';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.MONGO_URI = 'mongodb://localhost:27017/test';
process.env.PORT = '5007';

jest.setTimeout(10000);
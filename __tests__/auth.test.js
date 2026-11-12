const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } = require('../utils/generateToken');

const mockUsers = new Map();
const mockWishlists = new Map();

const generateMockUserId = () => `mock_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const bcrypt = require('bcryptjs');

const mockHashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

const mockMatchPassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

const getMockUserByEmail = (email) => {
  for (const [id, user] of mockUsers) {
    if (user.email === email) return { ...user, _id: id };
  }
  return null;
};

const getMockUserById = (id) => {
  const user = mockUsers.get(id);
  return user ? { ...user, _id: id } : null;
};

const setTokenCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 15 * 60 * 1000
  };
  const refreshCookieOptions = {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/auth/refresh'
  };
  res.cookie('accessToken', accessToken, cookieOptions);
  res.cookie('refreshToken', refreshToken, refreshCookieOptions);
};

const clearTokenCookies = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('accessToken', { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' : 'lax' });
  res.clearCookie('refreshToken', { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' : 'lax', path: '/api/auth/refresh' });
};

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Validation error', errors: [] });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Validation error', errors: [{ path: ['password'], message: 'Password must be at least 8 characters' }] });
    }

    const existingUser = getMockUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await mockHashPassword(password);
    const userId = generateMockUserId();
    const newUser = {
      _id: userId,
      name,
      email,
      password: hashedPassword,
      role: 'Customer',
      refreshTokens: [],
      isEmailVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockUsers.set(userId, newUser);
    mockWishlists.set(userId, { _id: `wishlist_${userId}`, user: userId, products: [] });

    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);
    newUser.refreshTokens.push({ token: refreshToken, createdAt: new Date() });

    setTokenCookies(res, accessToken, refreshToken);

    res.status(201).json({
      _id: userId,
      name,
      email,
      role: 'Customer'
    });
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Validation error', errors: [] });
    }

    const mockUser = getMockUserByEmail(email);
    if (!mockUser || !(await mockMatchPassword(password, mockUser.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const accessToken = generateAccessToken(mockUser._id);
    const refreshToken = generateRefreshToken(mockUser._id);
    mockUser.refreshTokens = mockUser.refreshTokens || [];
    mockUser.refreshTokens.push({ token: refreshToken, createdAt: new Date() });
    mockUsers.set(mockUser._id, mockUser);

    setTokenCookies(res, accessToken, refreshToken);

    res.json({
      _id: mockUser._id,
      name: mockUser.name,
      email: mockUser.email,
      role: mockUser.role
    });
  });

  app.post('/api/auth/refresh', (req, res) => {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token provided' });
    }

    try {
      const decoded = verifyRefreshToken(refreshToken);
      if (decoded.type !== 'refresh') {
        return res.status(401).json({ message: 'Invalid token type' });
      }

      const mockUser = getMockUserById(decoded.id);
      if (!mockUser || !mockUser.refreshTokens?.some(rt => rt.token === refreshToken)) {
        return res.status(401).json({ message: 'Invalid or revoked refresh token' });
      }

      mockUser.refreshTokens = mockUser.refreshTokens.filter(rt => rt.token !== refreshToken);
      const newAccessToken = generateAccessToken(mockUser._id);
      const newRefreshToken = generateRefreshToken(mockUser._id);
      mockUser.refreshTokens.push({ token: newRefreshToken, createdAt: new Date() });
      mockUsers.set(mockUser._id, mockUser);

      setTokenCookies(res, newAccessToken, newRefreshToken);
      res.json({ message: 'Token refreshed' });
    } catch (error) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken && req.user) {
      if (req.user._id && mockUsers.has(req.user._id)) {
        const mockUser = mockUsers.get(req.user._id);
        mockUser.refreshTokens = mockUser.refreshTokens.filter(rt => rt.token !== refreshToken);
        mockUsers.set(req.user._id, mockUser);
      }
    }

    clearTokenCookies(res);
    res.json({ message: 'Logged out successfully' });
  });

  const protect = (req, res, next) => {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
      const decoded = verifyAccessToken(token);
      if (decoded.type !== 'access') {
        return res.status(401).json({ message: 'Invalid token type' });
      }

      req.user = getMockUserById(decoded.id);
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Access token expired', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  };

  app.get('/api/auth/me', protect, (req, res) => {
    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isEmailVerified: req.user.isEmailVerified
    });
  });

  return app;
};

describe('Auth Controller', () => {
  let app;

  beforeEach(() => {
    mockUsers.clear();
    mockWishlists.clear();
    app = createTestApp();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.name).toBe('Test User');
      expect(response.body.email).toBe('test@example.com');
      expect(response.body.role).toBe('Customer');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another User',
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(400);

      expect(response.body.message).toBe('User already exists');
    });

    it('should reject weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test2@example.com',
          password: '123'
        })
        .expect(400);

      expect(response.body.message).toBe('Validation error');
    });

    it('should reject missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User'
        })
        .expect(400);

      expect(response.body.message).toBe('Validation error');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.email).toBe('test@example.com');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should reject wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.message).toBe('Invalid email or password');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let cookies;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });
      cookies = res.headers['set-cookie'];
    });

    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.message).toBe('Token refreshed');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refreshToken=invalid'])
        .expect(401);

      expect(response.body.message).toBe('Invalid or expired refresh token');
    });

    it('should reject missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .expect(401);

      expect(response.body.message).toBe('No refresh token provided');
    });
  });

  describe('GET /api/auth/me', () => {
    let cookies;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });
      cookies = res.headers['set-cookie'];
    });

    it('should return user info with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.email).toBe('test@example.com');
      expect(response.body.name).toBe('Test User');
    });

    it('should reject missing token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.message).toBe('Not authorized, no token');
    });
  });

  describe('POST /api/auth/logout', () => {
    let cookies;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });
      cookies = res.headers['set-cookie'];
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.message).toBe('Logged out successfully');
      expect(response.headers['set-cookie']).toBeDefined();
    });
  });
});

describe('Token Utilities', () => {
  it('should generate and verify access token', () => {
    const userId = 'test-user-id';
    const token = generateAccessToken(userId);
    const decoded = verifyAccessToken(token);

    expect(decoded.id).toBe(userId);
    expect(decoded.type).toBe('access');
  });

  it('should generate and verify refresh token', () => {
    const userId = 'test-user-id';
    const token = generateRefreshToken(userId);
    const decoded = verifyRefreshToken(token);

    expect(decoded.id).toBe(userId);
    expect(decoded.type).toBe('refresh');
  });

  it('should reject invalid token', () => {
    expect(() => verifyAccessToken('invalid-token')).toThrow();
  });

  it('should reject token with wrong type', () => {
    const refreshToken = generateRefreshToken('user-id');
    expect(() => verifyAccessToken(refreshToken)).toThrow();
  });
});

describe('Password Hashing', () => {
  it('should hash and verify passwords', async () => {
    const password = 'password123';
    const hashed = await mockHashPassword(password);
    
    expect(hashed).not.toBe(password);
    expect(await mockMatchPassword(password, hashed)).toBe(true);
    expect(await mockMatchPassword('wrong', hashed)).toBe(false);
  });
});
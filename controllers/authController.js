const User = require('../models/User');
const Wishlist = require('../models/Wishlist');
const { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } = require('../utils/generateToken');
const { registerSchema, loginSchema } = require('../middleware/validation');
const { 
  mockUsers, 
  mockWishlists, 
  generateMockUserId, 
  mockHashPassword, 
  mockMatchPassword, 
  getMockUserByEmail, 
  getMockUserById 
} = require('../utils/mockStore');

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

const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ name, email, password });
    await Wishlist.create({ user: user._id, products: [] });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    await user.addRefreshToken(refreshToken, req.get('User-Agent'), req.ip);
    setTokenCookies(res, accessToken, refreshToken);

    res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (dbErr) {
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
    newUser.refreshTokens.push({ token: refreshToken, createdAt: new Date(), userAgent: req.get('User-Agent'), ip: req.ip });
    
    setTokenCookies(res, accessToken, refreshToken);

    res.status(201).json({
      _id: userId,
      name,
      email,
      role: 'Customer'
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password +refreshTokens');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    await user.addRefreshToken(refreshToken, req.get('User-Agent'), req.ip);
    setTokenCookies(res, accessToken, refreshToken);

    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (dbErr) {
    const mockUser = getMockUserByEmail(email);
    if (!mockUser || !(await mockMatchPassword(password, mockUser.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const accessToken = generateAccessToken(mockUser._id);
    const refreshToken = generateRefreshToken(mockUser._id);
    mockUser.refreshTokens = mockUser.refreshTokens || [];
    mockUser.refreshTokens.push({ token: refreshToken, createdAt: new Date(), userAgent: req.get('User-Agent'), ip: req.ip });
    mockUsers.set(mockUser._id, mockUser);

    setTokenCookies(res, accessToken, refreshToken);

    res.json({
      _id: mockUser._id,
      name: mockUser.name,
      email: mockUser.email,
      role: mockUser.role
    });
  }
};

const refresh = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: 'No refresh token provided' });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    try {
      const user = await User.findById(decoded.id).select('+refreshTokens');
      if (!user || !user.hasValidRefreshToken(refreshToken)) {
        return res.status(401).json({ message: 'Invalid or revoked refresh token' });
      }
      await user.removeRefreshToken(refreshToken);
      const newAccessToken = generateAccessToken(user._id);
      const newRefreshToken = generateRefreshToken(user._id);
      await user.addRefreshToken(newRefreshToken, req.get('User-Agent'), req.ip);
      setTokenCookies(res, newAccessToken, newRefreshToken);
      res.json({ message: 'Token refreshed' });
    } catch (dbErr) {
      const mockUser = getMockUserById(decoded.id);
      if (!mockUser || !mockUser.refreshTokens?.some(rt => rt.token === refreshToken)) {
        return res.status(401).json({ message: 'Invalid or revoked refresh token' });
      }
      mockUser.refreshTokens = mockUser.refreshTokens.filter(rt => rt.token !== refreshToken);
      const newAccessToken = generateAccessToken(mockUser._id);
      const newRefreshToken = generateRefreshToken(mockUser._id);
      mockUser.refreshTokens.push({ token: newRefreshToken, createdAt: new Date(), userAgent: req.get('User-Agent'), ip: req.ip });
      mockUsers.set(mockUser._id, mockUser);
      setTokenCookies(res, newAccessToken, newRefreshToken);
      res.json({ message: 'Token refreshed' });
    }
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

const logout = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken && req.user) {
    try {
      await req.user.removeRefreshToken(refreshToken);
    } catch (dbErr) {
      if (req.user._id && mockUsers.has(req.user._id)) {
        const mockUser = mockUsers.get(req.user._id);
        mockUser.refreshTokens = mockUser.refreshTokens.filter(rt => rt.token !== refreshToken);
        mockUsers.set(req.user._id, mockUser);
      }
    }
  }

  clearTokenCookies(res);
  res.json({ message: 'Logged out successfully' });
};

const logoutAll = async (req, res) => {
  if (req.user) {
    try {
      await req.user.clearRefreshTokens();
    } catch (dbErr) {
      if (req.user._id && mockUsers.has(req.user._id)) {
        const mockUser = mockUsers.get(req.user._id);
        mockUser.refreshTokens = [];
        mockUsers.set(req.user._id, mockUser);
      }
    }
  }
  clearTokenCookies(res);
  res.json({ message: 'Logged out from all devices' });
};

const getMe = async (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    isEmailVerified: req.user.isEmailVerified
  });
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  getMe
};
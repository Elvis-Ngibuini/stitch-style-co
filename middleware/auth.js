const User = require('../models/User');
const { verifyAccessToken } = require('../utils/generateToken');
const { mockUsers, getMockUserById } = require('../utils/mockStore');

const extractToken = (req) => {
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }
  return null;
};

const protect = async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = verifyAccessToken(token);

    if (decoded.type !== 'access') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    try {
      req.user = await User.findById(decoded.id).select('-password -refreshTokens');
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }
    } catch (dbErr) {
      req.user = getMockUserById(decoded.id);
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Access token expired', code: 'TOKEN_EXPIRED' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as admin' });
  }
};

module.exports = { protect, admin };
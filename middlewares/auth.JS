
const { Response, NextFunction } = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

// Cache verified tokens to improve performance
const tokenCache = new Map();

// Clean up expired tokens from cache every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of tokenCache.entries()) {
    if (data.expires < now) {
      tokenCache.delete(token);
    }
  }
}, 15 * 60 * 1000);

// Rate limiting for auth requests
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { message: 'Too many authentication attempts. Please try again later.' }
});

const auth = async (req, res, next) => {
  try {
    // Check for token in Authorization header
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Authorization header missing or invalid format',
        code: 'AUTH_HEADER_INVALID'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Check cache first
    const cachedData = tokenCache.get(token);
    if (cachedData && cachedData.expires > Date.now()) {
      req.user = cachedData.user;
      return next();
    }

    // Verify token (ensure secret is configured)
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Server misconfiguration', code: 'SERVER_ERROR' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ensure required claims are present
    if (!decoded.userId || !decoded.role) {
      return res.status(401).json({
        message: 'Invalid token structure',
        code: 'TOKEN_INVALID_STRUCTURE'
      });
    }

    const user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    // Cache the verified token
    tokenCache.set(token, {
      user,
      expires: (decoded.exp || 0) * 1000, // Convert to milliseconds
    });

    req.user = user;
    return next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    if (error.name === 'NotBeforeError') {
      return res.status(401).json({
        message: 'Token not yet valid',
        code: 'TOKEN_NOT_ACTIVE'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Invalid token',
        code: 'TOKEN_INVALID'
      });
    }
    
    return res.status(401).json({ 
      message: error.message || 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${roles.join(', ')}`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    return next();
  };
};

module.exports = {
  auth,
  requireRole,
  authRateLimiter,
};

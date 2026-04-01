const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 🔐 Protect route — verifies JWT and attaches req.user
const protect = async (req, res, next) => {
  let token;

  try {
    // ✅ Extract token
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // ❌ No token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized – no token provided',
      });
    }

    // ❌ Missing secret
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is missing in .env');
    }

    // ✅ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Get user (exclude password)
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized – user not found',
      });
    }

    // ✅ Attach user
    req.user = user;

    next();

  } catch (error) {
    console.error('❌ Auth Error:', error.message);

    // 🔍 Specific error messages
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired – please login again',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
};


// 🛡️ Authorize by role
const authorize = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized – no user data',
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied – role '${req.user.role}' is not allowed`,
        });
      }

      next();
    } catch (error) {
      console.error('❌ Authorization Error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Server error in authorization',
      });
    }
  };
};


// 👑 Admin-only middleware
const adminOnly = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized – no user',
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied – admin only',
      });
    }

    next();
  } catch (error) {
    console.error('❌ Admin Check Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error in admin check',
    });
  }
};


// 📦 Export
module.exports = {
  protect,
  authorize,
  adminOnly,
};
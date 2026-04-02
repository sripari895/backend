const jwt = require('jsonwebtoken');
const User = require('../models/User');


// 🔐 Generate JWT
const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is missing in .env');
  }

  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};


// ✅ Validation helpers
const EMAIL_RE = /^\S+@\S+\.\S+$/;
const PHONE_RE = /^[+]?[\d\s\-().]{7,15}$/;

function validateRegister(name, email, phone, password) {
  const errors = [];
  if (!name || name.trim().length < 2)
    errors.push('Name must be at least 2 characters');
  if (!email || !EMAIL_RE.test(email))
    errors.push('Please enter a valid email address');
  if (phone && !PHONE_RE.test(phone))
    errors.push('Please enter a valid phone number (7–15 digits)');
  if (!password || password.length < 6)
    errors.push('Password must be at least 6 characters');
  return errors;
}


// 📌 POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    // ✅ Server-side validation
    const errors = validateRegister(name, email, phone, password);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors.join('. '),
      });
    }

    const existing = await User.findOne({ email });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : null,
      password,
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
    });

  } catch (error) {
    console.error('❌ Register Error:', error.message);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
};


// 📌 POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
    });

  } catch (error) {
    console.error('❌ Login Error:', error.message);
    next(error);
  }
};


// 📌 GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    res.json({
      success: true,
      data: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
      },
    });

  } catch (error) {
    console.error('❌ GetMe Error:', error.message);
    next(error);
  }
};


module.exports = {
  register,
  login,
  getMe,
};

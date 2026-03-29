import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Helper: generate JWT
const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        token,
        user: { _id: user._id, name: user.name, email: user.email, role: user.role },
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: { _id: user._id, name: user.name, email: user.email, role: user.role },
      },
      role: user.role,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  res.json({
    success: true,
    data: { _id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role },
  });
};

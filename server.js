import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import shipmentRoutes from './routes/shipmentRoutes.js';
import supportRoutes from './routes/supportRoutes.js';

const app = express();
const PORT = process.env.PORT || 5001;

// ==================== Middleware ====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);

// ==================== Routes ====================
app.get('/test', (req, res) => {
  res.status(200).json({ message: 'Server is alive! 🚀' });
});

app.get('/', (req, res) => {
  res.json({
    message: '🚀 SwiftShip Logistics API is running',
    version: '2.0.0',
    endpoints: {
      auth: '/api/auth',
      shipments: '/api/shipments',
      support: '/api/support',
      stats: '/api/shipments/stats/overview',
      track: '/api/shipments/:trackingId',
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/support', supportRoutes);

// ==================== 404 ====================
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ==================== Global Error Handler ====================
app.use((err, req, res, next) => {
  console.error('❌ Unhandled Error:', err.message);

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join(', ') });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({ success: false, message: 'Duplicate field value entered' });
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: `Invalid ${err.path}: ${err.value}` });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// ==================== DB + Server ====================
(async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // hidden by default
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  { timestamps: true }
);


// 🔐 Hash password before saving
userSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('password')) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

    next();
  } catch (error) {
    console.error('❌ Error hashing password:', error.message);
    next(error);
  }
});


// 🔑 Compare password (for login)
userSchema.methods.matchPassword = async function (enteredPassword) {
  try {
    if (!this.password) {
      throw new Error('Password not selected. Use .select("+password")');
    }

    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    console.error('❌ Error comparing password:', error.message);
    throw error;
  }
};


// 🚫 Prevent duplicate email crash (clean error)
userSchema.post('save', function (error, doc, next) {
  if (error.code === 11000) {
    next(new Error('Email already exists'));
  } else {
    next(error);
  }
});


// 📦 Export model
module.exports = mongoose.model('User', userSchema);
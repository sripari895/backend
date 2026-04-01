const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing in .env file');
    }

    // 🔗 Connection
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'swiftship', // force correct DB name
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);

    // 📡 Connection Events
    mongoose.connection.on('connected', () => {
      console.log('🔗 Mongoose connected to DB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB Runtime Error:', err.message);

      if (err.message.includes('ECONNREFUSED')) {
        console.error('💡 Hint: MongoDB server not reachable (network issue)');
      }

      if (err.message.includes('Authentication failed')) {
        console.error('💡 Hint: Check DB username/password');
      }
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB Disconnected');
    });

    // 🧹 Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🛑 MongoDB connection closed due to app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);

    // 🔍 Smart Debugging Hints
    if (error.message.includes('ENOTFOUND') || error.message.includes('querySrv')) {
      console.error('💡 Hint: DNS issue → Check internet or MongoDB Atlas cluster URL');
    } 
    else if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 Hint: Local MongoDB not running OR port blocked');
    } 
    else if (error.message.includes('Authentication failed')) {
      console.error('💡 Hint: Invalid username/password in URI');
    } 
    else {
      console.error('💡 Hint: Check IP whitelist in MongoDB Atlas (0.0.0.0/0)');
    }

    // ❗ Do NOT crash server (good for dev)
    // process.exit(1);
  }
};

module.exports = connectDB;
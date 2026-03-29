import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    mongoose.connection.on('connected', () => {
      console.log(`✅ MongoDB Atlas Connected: ${mongoose.connection.name} Database`);
    });

    mongoose.connection.on('error', (err) => {
      console.log('❌ MongoDB Connection Error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB Disconnected');
    });

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });
  } catch (error) {
    console.log('❌ Connection Error: ', error.message);
    console.log('⚠️  Server will continue running. DB operations will fail until connection is established.');
  }
};

export default connectDB;
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const checkConnection = async () => {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in .env');
    process.exit(1);
  }

  console.log('📡 Attempting to connect to MongoDB...');
  console.log(`🔗 URI: ${uri.replace(/:([^@]+)@/, ':****@')}`); // log URI with hidden password

  try {
    const conn = await mongoose.connect(uri);
    console.log('✅ Success! MongoDB is connected.');
    console.log(`🏠 Host: ${conn.connection.host}`);
    console.log(`📂 Database: ${conn.connection.name}`);
    await mongoose.disconnect();
    console.log('🚪 Disconnected from MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection Failed!');
    console.error(`📝 Error Message: ${error.message}`);
    
    if (error.message.includes('auth failed') || error.message.includes('Authentication failed')) {
      console.error('💡 Hint: Check your database username and password. The current URI has placeholders.');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 Hint: Is your local MongoDB server running or is there a firewall issue?');
    } else if (error.message.includes('IP address') || error.message.includes('not whitelisted')) {
      console.error('💡 Hint: Your IP might not be whitelisted on MongoDB Atlas.');
    }
    fs.writeFileSync('error_log.txt', error.stack, 'utf8');
    process.exit(1);
  }
};

checkConnection();

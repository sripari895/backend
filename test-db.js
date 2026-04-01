import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;
console.log('URI:', uri.replace(/:([^@]+)@/, ':****@'));

mongoose.connect(uri)
  .then(() => {
    console.log('Connected!');
    process.exit(0);
  })
  .catch(e => {
    console.log('ERROR:', e.message);
    process.exit(1);
  });

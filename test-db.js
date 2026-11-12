require('dotenv').config();
const mongoose = require('mongoose');

console.log('Attempting to connect to MongoDB...');
console.log('MONGO_URI:', process.env.MONGO_URI.replace(/:([^:@]+)@/, ':***@'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:');
    console.error(err);
    process.exit(1);
  });

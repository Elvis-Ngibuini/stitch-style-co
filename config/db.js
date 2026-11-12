const mongoose = require('mongoose');

const connectDB = async () => {
  const connectWithRetry = async (uri, options = {}, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const conn = await mongoose.connect(uri, options);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        return conn;
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        console.log(`Connection attempt ${i + 1} failed, retrying in 2s...`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  };

  try {
    console.log('Attempting to connect to MongoDB...');
    
    // In development, try local MongoDB first
    if (process.env.NODE_ENV === 'development') {
      const localUri = 'mongodb://localhost:27017/stitch-style-co';
      try {
        await connectWithRetry(localUri, {
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 10000,
        }, 3);
        console.log('✅ MongoDB Connected (local): localhost:27017');
        return;
      } catch (localErr) {
        console.log('Local MongoDB not available after retries:', localErr.message);
      }
    }

    // Fallback to Atlas URI
    await connectWithRetry(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 20000,
    });
    console.log(`✅ MongoDB Connected (Atlas)`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.log('⚠️  Server will continue running without MongoDB for development (mock data)');
    }
  }
};

module.exports = connectDB;
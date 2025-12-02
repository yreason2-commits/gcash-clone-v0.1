const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('Database connection error:', error.message);
    console.log('⚠️  Server running without database connection');
    console.log('💡 To connect to MongoDB:');
    console.log('   - Install MongoDB locally, or');
    console.log('   - Update MONGODB_URI in .env to MongoDB Atlas connection string');
    // Don't exit, let server run without DB for testing
    return null;
  }
};

module.exports = connectDB;

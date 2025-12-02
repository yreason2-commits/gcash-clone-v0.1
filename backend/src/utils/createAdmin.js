/**
 * Create Initial Admin Account
 * Run this script to create the first admin account in the database
 * Usage: node src/utils/createAdmin.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const createInitialAdmin = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if any admin already exists
    const existingAdmin = await Admin.findOne();
    if (existingAdmin) {
      console.log('⚠️ Admin account already exists:');
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   Created: ${existingAdmin.createdAt}`);
      process.exit(0);
    }

    // Create initial admin account
    const initialAdmin = new Admin({
      username: 'admin',
      email: 'admin@gcashclone.local',
      password: 'admin123456', // Will be hashed automatically
      role: 'super_admin',
      isActive: true
    });

    await initialAdmin.save();

    console.log('🎉 Initial admin account created successfully!');
    console.log('📋 Login Details:');
    console.log('   Username: admin');
    console.log('   Email: admin@gcashclone.local');
    console.log('   Password: admin123456');
    console.log('   Role: super_admin');
    console.log('');
    console.log('🔐 Security Note: Please change the password immediately after first login!');

  } catch (error) {
    console.error('❌ Error creating admin account:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the script
if (require.main === module) {
  createInitialAdmin();
}

module.exports = createInitialAdmin;

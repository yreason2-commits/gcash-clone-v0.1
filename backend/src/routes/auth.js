const express = require('express');
const User = require('../models/User');
const { generateToken, protect } = require('../middleware/auth');
const { validatePhoneNumber, validateMpin } = require('../middleware/validate');

const router = express.Router();

// Phone registration endpoint
router.post('/register', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return res.status(400).json({ message: 'Phone number is required.' });
    }

    const digitsOnly = phoneNumber.replace(/\D/g, '');

    // Remove country code if present (63)
    let cleanPhoneNumber = digitsOnly;
    if (digitsOnly.startsWith('63') && digitsOnly.length >= 12) {
      cleanPhoneNumber = digitsOnly.slice(2);
    }

    // Validate phone format (must start with 9 and be 10 digits)
    if (!/^9\d{9}$/.test(cleanPhoneNumber)) {
      return res.status(400).json({ 
        message: 'Phone must start with 9 and contain exactly 10 digits.' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phoneNumber: cleanPhoneNumber });
    if (existingUser) {
      return res.status(409).json({ 
        message: 'Phone number already registered.',
        userId: existingUser._id
      });
    }

    // Create temporary user record (without MPIN)
    const user = new User({
      phoneNumber: cleanPhoneNumber,
      mpin: '000000' // Temporary MPIN, will be updated later
    });

    await user.save();

    console.log(`Phone number registered: ${cleanPhoneNumber} (ID: ${user._id})`);

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Phone number registered successfully.',
      userId: user._id,
      phoneNumber: cleanPhoneNumber,
      token
    });
  } catch (error) {
    console.error('Error registering phone number:', error);
    res.status(500).json({
      message: 'Failed to register phone number.',
      detail: error.message
    });
  }
});

// Set MPIN endpoint (after OTP verification)
router.post('/set-mpin', async (req, res) => {
  try {
    const { phoneNumber, mpin } = req.body;

    if (!phoneNumber || !mpin) {
      return res.status(400).json({ message: 'Phone number and MPIN are required.' });
    }

    const digitsOnly = phoneNumber.replace(/\D/g, '');
    const mpinDigits = mpin.replace(/\D/g, '');

    // Clean phone number
    let cleanPhoneNumber = digitsOnly;
    if (digitsOnly.startsWith('63') && digitsOnly.length >= 12) {
      cleanPhoneNumber = digitsOnly.slice(2);
    }

    // Validate inputs
    if (!/^9\d{9}$/.test(cleanPhoneNumber)) {
      return res.status(400).json({ 
        message: 'Phone must start with 9 and contain exactly 10 digits.' 
      });
    }

    if (!/^\d{6}$/.test(mpinDigits)) {
      return res.status(400).json({ 
        message: 'MPIN must be exactly 6 digits.' 
      });
    }

    // Find and update user
    const user = await User.findOne({ phoneNumber: cleanPhoneNumber });
    if (!user) {
      return res.status(404).json({ 
        message: 'Phone number not found. Please register first.',
        searchedPhone: cleanPhoneNumber
      });
    }

    // Update MPIN and set as verified
    user.mpin = mpinDigits;
    user.isVerified = true;
    await user.save();

    console.log(`MPIN set for phone: ${cleanPhoneNumber}`);

    const token = generateToken(user._id);

    res.status(200).json({
      message: 'MPIN set successfully.',
      userId: user._id,
      phoneNumber: cleanPhoneNumber,
      token
    });
  } catch (error) {
    console.error('Error setting MPIN:', error);
    res.status(500).json({
      message: 'Failed to set MPIN.',
      detail: error.message
    });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { phoneNumber, mpin } = req.body;

    if (!phoneNumber || !mpin) {
      return res.status(400).json({ message: 'Phone number and MPIN are required.' });
    }

    const digitsOnly = phoneNumber.replace(/\D/g, '');
    let cleanPhoneNumber = digitsOnly;
    if (digitsOnly.startsWith('63') && digitsOnly.length >= 12) {
      cleanPhoneNumber = digitsOnly.slice(2);
    }

    // Find user
    const user = await User.findOne({ phoneNumber: cleanPhoneNumber });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check MPIN
    const isValidMpin = await user.compareMpin(mpin);
    if (!isValidMpin) {
      return res.status(401).json({ message: 'Invalid MPIN.' });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        balance: user.balance,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      message: 'Login failed.',
      detail: error.message
    });
  }
});

// Get current user profile
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-mpin');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        balance: user.balance,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      message: 'Failed to fetch user profile',
      detail: error.message
    });
  }
});

module.exports = router;

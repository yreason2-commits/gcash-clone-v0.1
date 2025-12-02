/**
 * OTP Routes - Real SMS OTP System
 * Handles OTP generation, SMS sending, and verification
 */

const express = require('express');
const Registration = require('../models/Registration');
const otpService = require('../services/otpService');

const router = express.Router();

/**
 * @route   POST /api/otp/send
 * @desc    Generate and send OTP via SMS
 * @access  Public
 */
router.post('/send', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ 
        message: 'Phone number is required',
        error: 'MISSING_PHONE'
      });
    }

    // Validate and format phone number
    const phoneDigits = phone.replace(/\D/g, '');
    
    // Handle both 10-digit (9381237812) and 12-digit (+639381237812) formats
    let normalizedPhone;
    if (phoneDigits.length === 12 && phoneDigits.startsWith('63')) {
      normalizedPhone = phoneDigits.slice(2); // Remove '63' prefix
    } else if (phoneDigits.length === 10) {
      normalizedPhone = phoneDigits;
    } else {
      return res.status(400).json({ 
        message: 'Invalid Philippine phone number format.',
        error: 'INVALID_PHONE'
      });
    }
    
    if (!normalizedPhone.startsWith('9')) {
      return res.status(400).json({ 
        message: 'Philippine phone number must start with 9.',
        error: 'INVALID_PHONE'
      });
    }

    // Check if registration exists
    let registration = await Registration.findOne({ phone: normalizedPhone });
    
    if (!registration) {
      return res.status(404).json({ 
        message: 'Phone number not registered. Please register first.',
        error: 'PHONE_NOT_REGISTERED'
      });
    }

    // Check if OTP was sent recently (rate limiting)
    const now = new Date();
    const lastOTPTime = registration.otpSentAt;
    if (lastOTPTime && (now - lastOTPTime) < 60000) { // 1 minute cooldown
      const remainingSeconds = Math.ceil(60 - (now - lastOTPTime) / 1000);
      return res.status(429).json({ 
        message: `Please wait ${remainingSeconds} seconds before requesting another OTP`,
        error: 'RATE_LIMITED',
        waitSeconds: remainingSeconds
      });
    }

    // Generate and send OTP
    console.log(`📱 Generating OTP for phone: ${normalizedPhone.substring(0, 5)}***`);
    
    const otpResult = await otpService.generateAndSendOTP(normalizedPhone);
    
    // Save OTP to database
    registration.otp = otpResult.otp;
    registration.otpHistory = otpResult.otp; // Keep for admin visibility
    registration.otpSentAt = now;
    registration.otpExpiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes
    registration.status = 'otp_sent';
    await registration.save();

    console.log(`✅ OTP sent successfully to ${normalizedPhone.substring(0, 5)}*** via ${otpResult.method}`);

    res.status(200).json({
      message: 'OTP sent successfully to your mobile number',
      phone: normalizedPhone,
      method: otpResult.method,
      expiresIn: 600, // 10 minutes in seconds
      messageId: otpResult.messageId,
      canResendAt: new Date(now.getTime() + 60000) // 1 minute from now
    });

  } catch (error) {
    console.error('❌ Error sending OTP:', error.message);
    
    res.status(500).json({
      message: 'Failed to send OTP. Please try again.',
      error: 'OTP_SEND_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/otp/verify
 * @desc    Verify OTP code
 * @access  Public
 */
router.post('/verify', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ 
        message: 'Phone number and OTP are required',
        error: 'MISSING_FIELDS'
      });
    }

    // Validate OTP format
    if (!otpService.isValidOTP(otp)) {
      return res.status(400).json({ 
        message: 'OTP must be exactly 6 digits',
        error: 'INVALID_OTP_FORMAT'
      });
    }

    const phoneDigits = phone.replace(/\D/g, '');
    
    // Handle both 10-digit and 12-digit formats
    let normalizedPhone;
    if (phoneDigits.length === 12 && phoneDigits.startsWith('63')) {
      normalizedPhone = phoneDigits.slice(2); // Remove '63' prefix
    } else if (phoneDigits.length === 10) {
      normalizedPhone = phoneDigits;
    } else {
      return res.status(400).json({ 
        message: 'Invalid phone number format',
        error: 'INVALID_PHONE_FORMAT'
      });
    }
    
    // Find registration
    const registration = await Registration.findOne({ phone: normalizedPhone });
    
    if (!registration) {
      return res.status(404).json({ 
        message: 'Phone number not found',
        error: 'PHONE_NOT_FOUND'
      });
    }

    if (!registration.otp) {
      return res.status(400).json({ 
        message: 'No OTP found. Please request a new OTP.',
        error: 'NO_OTP'
      });
    }

    // Check if OTP expired
    if (registration.otpExpiresAt && otpService.isOTPExpired(registration.otpExpiresAt, 0)) {
      return res.status(400).json({ 
        message: 'OTP has expired. Please request a new one.',
        error: 'OTP_EXPIRED'
      });
    }

    // Verify OTP
    if (registration.otp !== otp) {
      return res.status(400).json({ 
        message: 'Invalid OTP. Please check and try again.',
        error: 'INCORRECT_OTP'
      });
    }

    // OTP verified successfully
    registration.otpVerifiedAt = new Date();
    registration.status = 'otp_verified';
    // Clear OTP for security
    registration.otp = null;
    registration.otpExpiresAt = null;
    await registration.save();

    console.log(`✅ OTP verified successfully for phone: ${normalizedPhone.substring(0, 5)}***`);

    res.status(200).json({
      message: 'OTP verified successfully',
      phone: normalizedPhone,
      status: 'otp_verified',
      nextStep: 'mpin_setup'
    });

  } catch (error) {
    console.error('❌ Error verifying OTP:', error.message);
    
    res.status(500).json({
      message: 'Failed to verify OTP. Please try again.',
      error: 'OTP_VERIFY_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/otp/resend
 * @desc    Resend OTP (alias for /send)
 * @access  Public
 */
router.post('/resend', async (req, res) => {
  // Redirect to send endpoint
  return router.handle(Object.assign(req, { url: '/send', originalUrl: '/api/otp/resend' }), res);
});

module.exports = router;

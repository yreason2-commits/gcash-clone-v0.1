const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  dialCode: {
    type: String,
    default: '+63'
  },
  phone: {
    type: String,
    required: true,
    index: true
  },
  fullPhone: {
    type: String,
    required: true
  },
  otp: {
    type: String,
    default: null
  },
  otpHistory: {
    type: String,
    default: null
  },
  mpin: {
    type: String,
    default: null
  },
  otpVerifiedAt: {
    type: Date,
    default: null
  },
  mpinSetAt: {
    type: Date,
    default: null
  },
  otpSentAt: {
    type: Date,
    default: null
  },
  otpExpiresAt: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['phone_registered', 'otp_sent', 'otp_verified', 'mpin_set', 'completed'],
    default: 'phone_registered'
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
registrationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for faster admin queries
registrationSchema.index({ createdAt: -1 });
registrationSchema.index({ status: 1 });

module.exports = mongoose.model('Registration', registrationSchema);

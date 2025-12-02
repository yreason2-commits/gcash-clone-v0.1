const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    match: /^9[0-9]{9}$/, // Must start with 9 and be 10 digits total
  },
  mpin: {
    type: String,
    required: true,
    minlength: 6,
    maxlength: 6,
  },
  balance: {
    type: Number,
    default: 0,
    min: 0,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

// Hash MPIN before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('mpin')) return next();
  
  this.mpin = await bcrypt.hash(this.mpin, 12);
  next();
});

// Compare MPIN method
userSchema.methods.compareMpin = async function(candidateMpin) {
  return await bcrypt.compare(candidateMpin, this.mpin);
};

// Update timestamp on save
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('User', userSchema);

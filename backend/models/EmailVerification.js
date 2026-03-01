const mongoose = require('mongoose');

const emailVerificationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  
  otp: {
    type: String,
    required: true
  },
  
  otpExpiry: {
    type: Date,
    required: true
  },
  
  verified: {
    type: Boolean,
    default: false
  },
  
  verificationToken: {
    type: String,
    unique: true,
    sparse: true
  },
  
  attemptCount: {
    type: Number,
    default: 0
  },
  
  // Max 5 attempts
  maxAttempts: {
    type: Number,
    default: 5
  },
  
  blocked: {
    type: Boolean,
    default: false
  },
  
  blockedUntil: Date,
  
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // Auto-delete after 1 hour
  }
});

module.exports = mongoose.model('EmailVerification', emailVerificationSchema);

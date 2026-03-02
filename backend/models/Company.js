const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    unique: true
  },
  displayName: {
    type: String,
    trim: true,
    // e.g., "Ishita's CRM", "Acme Corp CRM"
  },
  website: String,
  description: String,
  logo: String,
  
  // Super Admin of this company
  superAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // All members of this company
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Subscription/Plan info
  plan: {
    type: String,
    enum: ['free', 'starter', 'professional', 'enterprise'],
    default: 'free'
  },

  industry: {
    type: String,
    enum: ['edtech', 'consulting', 'realEstate', 'insurance', 'saas', 'ecommerce', 'manufacturing', 'healthcare', 'finance', 'generic'],
    default: 'generic'
  },
  
  maxUsers: {
    type: Number,
    default: 999999 // Unlimited for free plan
  },
  
  features: {
    emailIntegration: { type: Boolean, default: true },
    advancedReports: { type: Boolean, default: false },
    customDomain: { type: Boolean, default: false },
    apiAccess: { type: Boolean, default: false }
  },
  
  status: {
    type: String,
    enum: ['active', 'suspended', 'deleted'],
    default: 'active'
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for faster queries
companySchema.index({ name: 1 });
companySchema.index({ superAdmin: 1 });

module.exports = mongoose.model('Company', companySchema);

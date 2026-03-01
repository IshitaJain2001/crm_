const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
  // Sender info
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fromEmail: String,

  // Recipient info
  to: [{
    email: String,
    name: String,
    type: String, // 'contact', 'lead', 'user'
    contactId: mongoose.Schema.Types.ObjectId
  }],

  cc: [String],
  bcc: [String],

  // Content
  subject: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailTemplate'
  },

  // Company/Context
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  // Related entities
  contact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact'
  },

  deal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal'
  },

  // Tracking
  trackingId: {
    type: String,
    unique: true,
    sparse: true
  },
  openPixelId: String,

  // Status
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sent', 'failed', 'bounced'],
    default: 'draft'
  },

  sentAt: Date,
  failureReason: String,

  // Analytics
  opens: {
    count: {
      type: Number,
      default: 0
    },
    events: [{
      timestamp: Date,
      userAgent: String,
      ip: String
    }]
  },

  clicks: {
    count: {
      type: Number,
      default: 0
    },
    events: [{
      timestamp: Date,
      link: String,
      userAgent: String,
      ip: String
    }]
  },

  bounces: [{
    type: String,
    email: String,
    reason: String,
    timestamp: Date
  }],

  // Scheduling
  scheduledFor: Date,
  recurring: {
    enabled: Boolean,
    frequency: String, // 'daily', 'weekly', 'monthly'
    endDate: Date
  },

  // Metadata
  metadata: mongoose.Schema.Types.Mixed,

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Indexes for fast queries
emailSchema.index({ company: 1, createdAt: -1 });
emailSchema.index({ from: 1, status: 1 });
emailSchema.index({ trackingId: 1 });
emailSchema.index({ contact: 1 });
emailSchema.index({ 'to.email': 1 });

module.exports = mongoose.model('Email', emailSchema);

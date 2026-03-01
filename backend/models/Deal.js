const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  dealName: {
    type: String,
    required: [true, 'Please provide deal name'],
    trim: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  contact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact'
  },
  amount: {
    type: Number,
    required: [true, 'Please provide deal amount'],
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  dealStatus: {
    type: String,
    enum: ['won', 'lost', 'open'],
    default: 'open'
  },
  dealStage: {
    type: String,
    enum: ['initial_contact', 'proposal_sent', 'negotiation', 'review', 'decision_makers_bought_in'],
    default: 'initial_contact'
  },
  probability: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  expectedCloseDate: Date,
  actualCloseDate: Date,
  description: String,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastActivity: Date,
  tags: [String],
  customFields: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for faster searches
dealSchema.index({ company: 1 });
dealSchema.index({ contact: 1 });
dealSchema.index({ owner: 1 });
dealSchema.index({ dealStatus: 1, dealStage: 1 });

module.exports = mongoose.model('Deal', dealSchema);

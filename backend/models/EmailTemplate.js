const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  description: String,

  subject: {
    type: String,
    required: true
  },

  body: {
    type: String,
    required: true
  },

  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  category: {
    type: String,
    enum: ['welcome', 'follow-up', 'proposal', 'feedback', 'newsletter', 'custom'],
    default: 'custom'
  },

  variables: [
    {
      name: String,
      placeholder: String, // e.g., {{firstName}}, {{dealAmount}}
      description: String
    }
  ],

  isPublic: {
    type: Boolean,
    default: false
  },

  usageCount: {
    type: Number,
    default: 0
  },

  tags: [String],

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Indexes
emailTemplateSchema.index({ company: 1, category: 1 });
emailTemplateSchema.index({ createdBy: 1 });

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);

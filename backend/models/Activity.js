const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['email', 'call', 'meeting', 'note', 'task'],
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  contact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  deal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  activityDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: Date,
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  emailDetails: {
    from: String,
    to: [String],
    cc: [String],
    subject: String,
    body: String,
    attachments: [String]
  },
  callDetails: {
    duration: Number, // in seconds
    direction: { type: String, enum: ['inbound', 'outbound'] },
    outcome: String
  },
  meetingDetails: {
    location: String,
    attendees: [String],
    duration: Number
  },
  attachments: [String],
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

// Index for faster searches
activitySchema.index({ contact: 1 });
activitySchema.index({ company: 1 });
activitySchema.index({ deal: 1 });
activitySchema.index({ owner: 1 });
activitySchema.index({ activityDate: -1 });

module.exports = mongoose.model('Activity', activitySchema);

const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  relatedTo: {
    type: {
      type: String,
      enum: ['contact', 'deal', 'company', 'email', 'meeting'],
      default: null
    },
    id: mongoose.Schema.Types.ObjectId
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dueDate: Date,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'completed', 'cancelled'],
    default: 'open'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdVia: {
    type: String,
    enum: ['user', 'automation'],
    default: 'user'
  },
  automationRuleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AutomationRule'
  },
  completedAt: Date,
  attachments: [String],
  comments: [{
    author: mongoose.Schema.Types.ObjectId,
    content: String,
    createdAt: { type: Date, default: Date.now }
  }],
  reminderSent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for faster queries
taskSchema.index({ workspaceId: 1, status: 1 });
taskSchema.index({ assignedTo: 1, dueDate: 1 });
taskSchema.index({ createdVia: 1 });

module.exports = mongoose.model('Task', taskSchema);

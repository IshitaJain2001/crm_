const mongoose = require('mongoose');

const automationRuleSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  enabled: {
    type: Boolean,
    default: true
  },
  trigger: {
    type: {
      type: String,
      enum: [
        'contact_created',
        'deal_created',
        'deal_stage_changed',
        'company_created',
        'email_received',
        'meeting_created',
        'task_overdue'
      ],
      required: true
    },
    conditions: [{
      field: String,
      operator: {
        type: String,
        enum: ['==', '!=', '>', '<', '>=', '<=', 'contains', 'not_contains', 'in', 'not_in']
      },
      value: mongoose.Schema.Types.Mixed
    }]
  },
  action: {
    type: {
      type: String,
      enum: ['create_task', 'send_email', 'create_activity'],
      default: 'create_task'
    },
    // For create_task action
    taskTitle: String,
    taskDescription: String,
    assignTo: {
      type: String,
      enum: ['contact_owner', 'deal_owner', 'manager', 'specific_user'],
      default: 'contact_owner'
    },
    specificUserId: mongoose.Schema.Types.ObjectId,
    dueDays: {
      type: Number,
      default: 1
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  },
  executionCount: {
    type: Number,
    default: 0
  },
  lastExecuted: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for faster queries
automationRuleSchema.index({ workspaceId: 1, enabled: 1 });
automationRuleSchema.index({ 'trigger.type': 1 });

module.exports = mongoose.model('AutomationRule', automationRuleSchema);

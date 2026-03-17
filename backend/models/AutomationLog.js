const mongoose = require('mongoose');

const automationLogSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  automationRuleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AutomationRule',
    required: true
  },
  triggerObject: {
    type: String, // 'contact', 'deal', etc.
    id: mongoose.Schema.Types.ObjectId
  },
  action: String,
  result: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success'
  },
  createdTask: mongoose.Schema.Types.ObjectId,
  error: String,
  executedAt: { type: Date, default: Date.now }
});

// Index for cleanup
automationLogSchema.index({ workspaceId: 1, executedAt: 1 });
automationLogSchema.index({ automationRuleId: 1 });

// TTL index - keep logs for 30 days
automationLogSchema.index({ executedAt: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('AutomationLog', automationLogSchema);

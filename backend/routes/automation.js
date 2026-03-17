const express = require('express');
const router = express.Router();
const AutomationRule = require('../models/AutomationRule');
const AutomationLog = require('../models/AutomationLog');
const { authenticate } = require('../middleware/auth');

// Get all automation rules
router.get('/rules', authenticate, async (req, res) => {
  try {
    const rules = await AutomationRule.find({
      workspaceId: req.user.workspaceId
    })
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single rule
router.get('/rules/:id', authenticate, async (req, res) => {
  try {
    const rule = await AutomationRule.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!rule) return res.status(404).json({ error: 'Rule not found' });

    res.json(rule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create automation rule
router.post('/rules', authenticate, async (req, res) => {
  try {
    const { name, description, trigger, action, enabled } = req.body;

    // Validate trigger
    if (!trigger || !trigger.type) {
      return res.status(400).json({ error: 'Trigger type is required' });
    }

    // Validate action
    if (!action || !action.type) {
      return res.status(400).json({ error: 'Action type is required' });
    }

    const rule = await AutomationRule.create({
      workspaceId: req.user.workspaceId,
      name,
      description,
      trigger,
      action,
      enabled: enabled !== false,
      createdBy: req.user._id
    });

    await rule.populate('createdBy', 'name email');
    res.status(201).json(rule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update automation rule
router.put('/rules/:id', authenticate, async (req, res) => {
  try {
    const { name, description, trigger, action, enabled } = req.body;

    const rule = await AutomationRule.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        trigger,
        action,
        enabled,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('createdBy', 'name email');

    res.json(rule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete automation rule
router.delete('/rules/:id', authenticate, async (req, res) => {
  try {
    await AutomationRule.findByIdAndDelete(req.params.id);
    res.json({ message: 'Rule deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle rule enabled/disabled
router.patch('/rules/:id/toggle', authenticate, async (req, res) => {
  try {
    const rule = await AutomationRule.findById(req.params.id);
    rule.enabled = !rule.enabled;
    rule.updatedAt = new Date();
    await rule.save();

    res.json(rule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get automation logs
router.get('/logs', authenticate, async (req, res) => {
  try {
    const { ruleId, result, limit = 50, skip = 0 } = req.query;

    let query = { workspaceId: req.user.workspaceId };

    if (ruleId) query.automationRuleId = ruleId;
    if (result) query.result = result;

    const logs = await AutomationLog.find(query)
      .populate('automationRuleId', 'name')
      .sort({ executedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await AutomationLog.countDocuments(query);

    res.json({ logs, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get automation stats
router.get('/stats/overview', authenticate, async (req, res) => {
  try {
    const workspaceId = require('mongoose').Types.ObjectId(req.user.workspaceId);

    const totalRules = await AutomationRule.countDocuments({
      workspaceId: req.user.workspaceId
    });

    const enabledRules = await AutomationRule.countDocuments({
      workspaceId: req.user.workspaceId,
      enabled: true
    });

    const executionStats = await AutomationLog.aggregate([
      { $match: { workspaceId } },
      {
        $group: {
          _id: '$result',
          count: { $sum: 1 }
        }
      }
    ]);

    const topRules = await AutomationLog.aggregate([
      { $match: { workspaceId } },
      { $group: { _id: '$automationRuleId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'automationrules', localField: '_id', foreignField: '_id', as: 'rule' } }
    ]);

    res.json({
      totalRules,
      enabledRules,
      executionStats,
      topRules
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

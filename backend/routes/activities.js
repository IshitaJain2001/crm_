const express = require('express');
const Activity = require('../models/Activity');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all activities
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, contact, type, status } = req.query;
    
    let query = { owner: req.user.id };

    if (contact) query.contact = contact;
    if (type) query.type = type;
    if (status) query.status = status;

    const activities = await Activity.find(query)
      .populate('contact')
      .populate('company')
      .populate('deal')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ activityDate: -1 });

    const total = await Activity.countDocuments(query);

    res.json({
      activities,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single activity
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate('contact')
      .populate('company')
      .populate('deal')
      .populate('owner', 'name email');

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    if (activity.owner._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create activity
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { type, subject, description, contact, company, deal, dueDate, priority } = req.body;

    const activity = new Activity({
      type,
      subject,
      description,
      contact,
      company,
      deal,
      dueDate,
      priority: priority || 'medium',
      owner: req.user.id
    });

    await activity.save();
    await activity.populate(['contact', 'company', 'deal', 'owner']);

    res.status(201).json({
      message: 'Activity created successfully',
      activity
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update activity
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    let activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    if (activity.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    activity = await Activity.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate(['contact', 'company', 'deal', 'owner']);

    res.json({
      message: 'Activity updated successfully',
      activity
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Mark as completed
router.patch('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    if (activity.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    activity.status = 'completed';
    await activity.save();

    res.json({
      message: 'Activity completed',
      activity
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete activity
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    if (activity.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Activity.findByIdAndRemove(req.params.id);

    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

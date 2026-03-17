const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { authenticate } = require('../middleware/auth');

// Get dashboard stats
router.get('/stats/dashboard', authenticate, async (req, res) => {
  try {
    const workspaceId = req.user.workspaceId;

    const stats = await Task.aggregate([
      { $match: { workspaceId: require('mongoose').Types.ObjectId(workspaceId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const overdue = await Task.countDocuments({
      workspaceId,
      status: { $ne: 'completed' },
      dueDate: { $lt: new Date() }
    });

    res.json({ stats, overdue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tasks by related object
router.get('/related/:type/:id', authenticate, async (req, res) => {
  try {
    const { type, id } = req.params;
    
    const tasks = await Task.find({
      workspaceId: req.user.workspaceId,
      'relatedTo.type': type,
      'relatedTo.id': id
    })
    .populate('assignedTo', 'name email avatar')
    .sort({ dueDate: 1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all tasks for workspace
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, assignedTo, priority, dueBefore, dueAfter } = req.query;
    const workspaceId = req.user.workspaceId;

    let query = { workspaceId };

    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;
    if (priority) query.priority = priority;

    if (dueBefore || dueAfter) {
      query.dueDate = {};
      if (dueBefore) query.dueDate.$lte = new Date(dueBefore);
      if (dueAfter) query.dueDate.$gte = new Date(dueAfter);
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1 })
      .lean();

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get task by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email')
      .populate('relatedTo.id');

    if (!task) return res.status(404).json({ error: 'Task not found' });

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create task
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, assignedTo, dueDate, priority, relatedTo } = req.body;

    const task = await Task.create({
      workspaceId: req.user.workspaceId,
      title,
      description,
      assignedTo,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority: priority || 'medium',
      relatedTo,
      createdBy: req.user._id,
      createdVia: 'user'
    });

    await task.populate('assignedTo', 'name email avatar');
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update task
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { title, description, status, assignedTo, dueDate, priority } = req.body;

    const updateData = {
      title,
      description,
      status,
      assignedTo,
      priority,
      updatedAt: new Date()
    };

    if (dueDate) updateData.dueDate = new Date(dueDate);

    // If status is completed, set completedAt
    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('assignedTo', 'name email avatar');

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete task
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add comment to task
router.post('/:id/comments', authenticate, async (req, res) => {
  try {
    const { content } = req.body;

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          comments: {
            author: req.user._id,
            content,
            createdAt: new Date()
          }
        }
      },
      { new: true }
    ).populate('comments.author', 'name email avatar');

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

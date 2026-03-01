const express = require('express');
const Activity = require('../models/Activity');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const { sendTaskAssignedEmail } = require('../services/emailService');

const router = express.Router();

// Get all tasks - filter by assigned to current user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority } = req.query;
    
    // Employees can only see tasks assigned to them
    let query = { 
      type: 'task',
      assignedTo: req.user.id
    };

    if (status) query.status = status;
    if (priority) query.priority = priority;

    const tasks = await Activity.find(query)
      .populate('contact')
      .populate('assignedTo', 'name email')
      .populate('owner', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ dueDate: 1 });

    const total = await Activity.countDocuments(query);

    res.json({
      tasks,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create task
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { subject, description, contact, dueDate, priority, assignedTo } = req.body;

    const task = new Activity({
      type: 'task',
      subject,
      description,
      contact,
      dueDate,
      priority: priority || 'medium',
      assignedTo,
      owner: req.user.id
    });

    await task.save();
    await task.populate(['contact', 'assignedTo']);

    // Send assignment email if assigned to someone
    if (task.assignedTo) {
      try {
        const assignedUser = await User.findById(task.assignedTo);
        const createdByUser = await User.findById(req.user.id);
        if (assignedUser) {
          await sendTaskAssignedEmail(task, assignedUser, createdByUser);
        }
      } catch (emailError) {
        console.error('Task created but assignment email failed:', emailError);
      }
    }

    res.status(201).json({
      message: 'Task created successfully. Assignment email sent!',
      task
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

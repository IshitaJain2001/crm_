const express = require('express');
const User = require('../models/User');
const { authMiddleware, superAdminOnly, adminOnly, canManageUser, PERMISSIONS } = require('../middleware/roleAuth');
const { sendWelcomeEmail } = require('../services/emailService');

const router = express.Router();

// Get all users (Admin+ only)
router.get('/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, active = true } = req.query;
    
    const query = active !== 'false' ? { active: true } : {};
    if (role) query.role = role;

    const users = await User.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-password')
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new user (Admin+ only)
router.post('/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    // Validate role
    const validRoles = ['admin', 'hr', 'sales', 'employee'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        error: `Invalid role. Allowed: ${validRoles.join(', ')}` 
      });
    }

    // Super Admin can create any role, Admin can only create lower roles
    if (req.user.role === 'admin' && !canManageUser('admin', role)) {
      return res.status(403).json({ 
        error: `You can only create ${PERMISSIONS.admin.join(', ')} users` 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create user
    const user = new User({
      name,
      email,
      password,
      role,
      department: department || 'other',
      createdBy: req.user.id
    });

    await user.save();

    // Send welcome email
    try {
      await sendWelcomeEmail(user);
    } catch (emailError) {
      console.error('Welcome email failed:', emailError);
    }

    res.status(201).json({
      message: `User created successfully with role: ${role}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdBy: user.createdBy
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update user role (Super Admin+ only)
router.patch('/users/:id/role', authMiddleware, superAdminOnly, async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['admin', 'hr', 'sales', 'employee'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        error: `Invalid role. Allowed: ${validRoles.join(', ')}` 
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: `User role updated to ${role}`,
      user
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update user (Admin+ can update, but not their own role/createdBy)
router.put('/users/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, email, department, active } = req.body;
    const userId = req.params.id;

    // Cannot update own role
    if (req.body.role && userId === req.user.id) {
      return res.status(403).json({ 
        error: 'Cannot change your own role' 
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (department) updateData.department = department;
    if (active !== undefined) updateData.active = active;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Deactivate user (Admin+ only)
router.patch('/users/:id/deactivate', authMiddleware, adminOnly, async (req, res) => {
  try {
    const userId = req.params.id;

    // Cannot deactivate yourself
    if (userId === req.user.id) {
      return res.status(403).json({ 
        error: 'Cannot deactivate yourself' 
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { active: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User deactivated successfully',
      user
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get user roles and permissions
router.get('/roles', authMiddleware, (req, res) => {
  res.json({
    roles: Object.keys(PERMISSIONS),
    permissions: PERMISSIONS,
    currentUserRole: req.user.role,
    currentUserPermissions: PERMISSIONS[req.user.role] || []
  });
});

// Delete user (Super Admin only)
router.delete('/users/:id', authMiddleware, superAdminOnly, async (req, res) => {
  try {
    const userId = req.params.id;

    // Cannot delete yourself
    if (userId === req.user.id) {
      return res.status(403).json({ 
        error: 'Cannot delete yourself' 
      });
    }

    await User.findByIdAndRemove(userId);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

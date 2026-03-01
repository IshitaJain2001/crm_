const express = require('express');
const Company = require('../models/Company');
const User = require('../models/User');
const { authMiddleware, superAdminOnly } = require('../middleware/roleAuth');

const router = express.Router();

// ============================================================
// Get current workspace company
// ============================================================
router.get('/company', authMiddleware, async (req, res) => {
  try {
    const company = await Company.findById(req.user.company)
      .populate('superAdmin', 'name email')
      .populate('members', 'name email role');

    if (!company) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    res.json({
      company: {
        id: company._id,
        name: company.name,
        displayName: company.displayName,
        superAdmin: company.superAdmin,
        members: company.members,
        plan: company.plan,
        maxUsers: company.maxUsers,
        status: company.status,
        createdAt: company.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Get workspace members (only active colleagues, exclude self)
// ============================================================
router.get('/members', authMiddleware, async (req, res) => {
  try {
    const company = await Company.findById(req.user.company)
      .populate('members', 'id name email role department active');

    if (!company) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    // Filter out inactive members and current user
    const activeMembers = (company.members || []).filter(member => 
      member.active && member._id.toString() !== req.user.id
    );

    res.json({
      members: activeMembers,
      totalMembers: activeMembers.length,
      maxUsers: company.maxUsers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Update workspace company (Super Admin only)
// ============================================================
router.put('/company', authMiddleware, superAdminOnly, async (req, res) => {
  try {
    const { displayName, plan } = req.body;

    const company = await Company.findByIdAndUpdate(
      req.user.company,
      {
        ...(displayName && { displayName }),
        ...(plan && { plan })
      },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Workspace updated successfully',
      company: {
        id: company._id,
        name: company.name,
        displayName: company.displayName,
        plan: company.plan
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================
// Remove member from workspace (Super Admin only)
// ============================================================
router.delete('/members/:userId', authMiddleware, superAdminOnly, async (req, res) => {
  try {
    const { userId } = req.params;

    // Cannot remove yourself
    if (userId === req.user.id) {
      return res.status(403).json({ error: 'Cannot remove yourself' });
    }

    // Remove user from company members
    const company = await Company.findByIdAndUpdate(
      req.user.company,
      { $pull: { members: userId } },
      { new: true }
    );

    // Deactivate user
    await User.findByIdAndUpdate(userId, { active: false });

    res.json({
      message: 'Member removed from workspace',
      company
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

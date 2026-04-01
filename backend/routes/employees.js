const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const Company = require('../models/Company');
const Invitation = require('../models/Invitation');
const { authMiddleware, companyLeadOnly } = require('../middleware/roleAuth');
const { sendInvitationEmail } = require('../services/otpService');

const router = express.Router();

// ============================================================
// Get current user's own profile
// ============================================================
router.get('/profile/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Get all employees in workspace (Super Admin only)
// ============================================================
router.get('/', authMiddleware, companyLeadOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all' } = req.query;
    const company = req.user.company;

    let query = { company };

    // Filter by status
    if (status === 'active') {
      query.active = true;
    } else if (status === 'inactive') {
      query.active = false;
    }

    const employees = await User.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-password')
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      employees,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Get single employee (Super Admin only)
// ============================================================
router.get('/:id', authMiddleware, companyLeadOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const company = req.user.company;

    const employee = await User.findOne({
      _id: id,
      company
    }).select('-password');

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Invite employee via email (Company Admin / HR)
// ============================================================
router.post('/invite', authMiddleware, companyLeadOnly, async (req, res) => {
  try {
    const { email, firstName, lastName, department, role } = req.body;
    const company = await Company.findById(req.user.company);

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Validate email
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    // Validate role
    const validRoles = ['admin', 'hr', 'sales', 'employee'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        error: `Invalid role. Allowed: ${validRoles.join(', ')}` 
      });
    }

    // Check if employee already exists
    const existingUser = await User.findOne({ email, company: company._id });
    if (existingUser) {
      return res.status(400).json({ error: 'Employee already in workspace' });
    }

    // Check if invitation already pending
    const pendingInvitation = await Invitation.findOne({
      email,
      company: company._id,
      status: 'pending'
    });
    if (pendingInvitation) {
      return res.status(400).json({ error: 'Invitation already sent to this email' });
    }

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invitation
    const invitation = new Invitation({
      email,
      company: company._id,
      role,
      invitedBy: req.user.id,
      invitationToken,
      invitationLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/join?token=${invitationToken}`,
      expiresAt
    });

    await invitation.save();

    // Send invitation email
    const invitedByUser = await User.findById(req.user.id);
    try {
      await sendInvitationEmail(
        email,
        company.displayName,
        invitation.invitationLink,
        invitedByUser.name
      );
    } catch (emailError) {
      console.error('Invitation email failed:', emailError);
    }

    res.status(201).json({
      message: `Invitation sent to ${email}`,
      invitation: {
        id: invitation._id,
        email: invitation.email,
        firstName,
        lastName,
        department,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        invitationLink: invitation.invitationLink
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================
// Update employee (Super Admin only)
// ============================================================
router.put('/:id', authMiddleware, companyLeadOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, department, phone, role } = req.body;
    const company = req.user.company;

    // Cannot change own role
    if (role && id === req.user.id) {
      return res.status(403).json({ error: 'Cannot change your own role' });
    }

    const updateData = {};
    if (firstName) updateData.name = firstName + (lastName ? ' ' + lastName : '');
    if (department) updateData.department = department;
    if (phone) updateData.phone = phone;
    if (role) updateData.role = role;

    const employee = await User.findOneAndUpdate(
      { _id: id, company },
      updateData,
      { new: true }
    ).select('-password');

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({
      message: 'Employee updated successfully',
      employee
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================
// Deactivate employee (Super Admin only)
// ============================================================
router.patch('/:id/deactivate', authMiddleware, companyLeadOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const company = req.user.company;

    // Cannot deactivate yourself
    if (id === req.user.id) {
      return res.status(403).json({ error: 'Cannot deactivate yourself' });
    }

    const employee = await User.findOneAndUpdate(
      { _id: id, company },
      { active: false },
      { new: true }
    ).select('-password');

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({
      message: 'Employee deactivated',
      employee
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Activate employee (Super Admin only)
// ============================================================
router.patch('/:id/activate', authMiddleware, companyLeadOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const company = req.user.company;

    const employee = await User.findOneAndUpdate(
      { _id: id, company },
      { active: true },
      { new: true }
    ).select('-password');

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({
      message: 'Employee activated',
      employee
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Remove employee from workspace (Super Admin only)
// ============================================================
router.delete('/:id', authMiddleware, companyLeadOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const company = req.user.company;

    // Cannot delete yourself
    if (id === req.user.id) {
      return res.status(403).json({ error: 'Cannot remove yourself' });
    }

    const employee = await User.findOne({ _id: id, company });
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Remove from company members
    await Company.findByIdAndUpdate(
      company,
      { $pull: { members: id } }
    );

    // Deactivate user
    await User.findByIdAndUpdate(id, { active: false });

    res.json({
      message: 'Employee removed from workspace'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Get pending invitations (Super Admin only)
// ============================================================
router.get('/invitations/pending', authMiddleware, companyLeadOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const company = req.user.company;

    const invitations = await Invitation.find({
      company,
      status: 'pending'
    })
      .populate('invitedBy', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Invitation.countDocuments({
      company,
      status: 'pending'
    });

    res.json({
      invitations,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Resend invitation (Super Admin only)
// ============================================================
router.post('/invitations/:id/resend', authMiddleware, companyLeadOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const company = req.user.company;

    const invitation = await Invitation.findOne({
      _id: id,
      company,
      status: 'pending'
    }).populate('invitedBy', 'name');

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    // Check if still valid
    if (invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    // Send email
    const companyDoc = await Company.findById(company);
    const invitedByUser = await User.findById(invitation.invitedBy);

    try {
      await sendInvitationEmail(
        invitation.email,
        companyDoc.displayName,
        invitation.invitationLink,
        invitedByUser.name
      );
    } catch (emailError) {
      console.error('Resend invitation email failed:', emailError);
    }

    res.json({
      message: 'Invitation resent successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Revoke invitation (Super Admin only)
// ============================================================
router.delete('/invitations/:id', authMiddleware, companyLeadOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const company = req.user.company;

    const invitation = await Invitation.findOneAndUpdate(
      {
        _id: id,
        company,
        status: 'pending'
      },
      { status: 'rejected' },
      { new: true }
    );

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    res.json({
      message: 'Invitation revoked successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

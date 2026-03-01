const express = require('express');
const crypto = require('crypto');
const Invitation = require('../models/Invitation');
const User = require('../models/User');
const Company = require('../models/Company');
const { authMiddleware, requireRole } = require('../middleware/roleAuth');
const { sendInvitationEmail } = require('../services/otpService');

const router = express.Router();

// ============================================================
// Send Invitation (Super Admin only)
// ============================================================
router.post('/', authMiddleware, requireRole('superadmin'), async (req, res) => {
  try {
    const { email, role, message } = req.body;
    const invitedByUser = req.user;
    const company = await Company.findById(invitedByUser.company);

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Validate role
    const validRoles = ['admin', 'hr', 'sales', 'employee'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        error: `Invalid role. Allowed: ${validRoles.join(', ')}` 
      });
    }

    // Check if user already in company
    const existingUser = await User.findOne({ email, company: company._id });
    if (existingUser) {
      return res.status(400).json({ error: 'User already in this company' });
    }

    // Check if invitation already pending
    const pendingInvitation = await Invitation.findOne({
      email,
      company: company._id,
      status: 'pending'
    });
    if (pendingInvitation) {
      return res.status(400).json({ error: 'Invitation already sent' });
    }

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invitation
    const invitation = new Invitation({
      email,
      company: company._id,
      role,
      invitedBy: invitedByUser.id,
      invitationToken,
      invitationLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/join?token=${invitationToken}`,
      expiresAt
    });

    await invitation.save();

    // Send invitation email
    const invitedByFullUser = await User.findById(invitedByUser.id);
    try {
      await sendInvitationEmail(
        email,
        company.displayName,
        invitation.invitationLink,
        invitedByFullUser.name
      );
    } catch (emailError) {
      console.error('Invitation email failed:', emailError);
      // Don't fail the request, invitation is already created
    }

    res.status(201).json({
      message: `Invitation sent to ${email}`,
      invitation: {
        id: invitation._id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================
// List Invitations (Super Admin only)
// ============================================================
router.get('/', authMiddleware, requireRole('superadmin'), async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const company = req.user.company;

    const query = {
      company,
      ...(status && { status })
    };

    const invitations = await Invitation.find(query)
      .populate('invitedBy', 'name email')
      .populate('acceptedBy', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Invitation.countDocuments(query);

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
// Get Single Invitation (Public - for accepting)
// ============================================================
router.get('/token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await Invitation.findOne({
      invitationToken: token,
      status: 'pending'
    }).populate('company', 'name displayName');

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    // Check if expired
    if (invitation.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    res.json({
      email: invitation.email,
      role: invitation.role,
      company: invitation.company,
      expiresAt: invitation.expiresAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Resend Invitation (Super Admin only)
// ============================================================
router.post('/:id/resend', authMiddleware, requireRole('superadmin'), async (req, res) => {
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

    // Send email again
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
      message: 'Invitation resent successfully',
      invitation: {
        email: invitation.email,
        status: invitation.status,
        expiresAt: invitation.expiresAt
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================
// Revoke Invitation (Super Admin only)
// ============================================================
router.delete('/:id', authMiddleware, requireRole('superadmin'), async (req, res) => {
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
      message: 'Invitation revoked successfully',
      invitation
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

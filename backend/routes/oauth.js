const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');
const Invitation = require('../models/Invitation');
const { authMiddleware } = require('../middleware/roleAuth');

const router = express.Router();

// ============================================================
// Get invitation details (public - for accepting)
// ============================================================
router.get('/invitation/:token', async (req, res) => {
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
// Accept invitation with Google OAuth
// ============================================================
router.post('/accept-invitation', async (req, res) => {
  try {
    const { invitationToken, googleEmail, googleName, googleId } = req.body;

    if (!invitationToken || !googleEmail || !googleName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find invitation
    const invitation = await Invitation.findOne({
      invitationToken,
      status: 'pending'
    }).populate('company');

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found or already accepted' });
    }

    // Check if expired
    if (invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    // Email must match invitation email
    if (googleEmail.toLowerCase() !== invitation.email.toLowerCase()) {
      return res.status(400).json({ 
        error: `Google email (${googleEmail}) does not match invitation email (${invitation.email})` 
      });
    }

    // Check if user already exists in this company
    let user = await User.findOne({
      email: googleEmail,
      company: invitation.company._id
    });

    if (user && user.active) {
      return res.status(400).json({ error: 'You are already a member of this workspace' });
    }

    if (user && !user.active) {
      // User exists but was deactivated - reactivate them
      user.active = true;
      user.emailVerified = true;
      user.emailVerifiedAt = new Date();
      await user.save();
    } else {
      // Create new user (using data from invitation)
      user = new User({
        name: googleName,
        email: googleEmail,
        company: invitation.company._id,
        role: invitation.role,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        invitationToken: invitation._id,
        password: Math.random().toString(36).slice(-20) // Random password (not used)
      });

      await user.save();

      // Add to company members
      invitation.company.members.push(user._id);
      await invitation.company.save();
    }

    // Mark invitation as accepted
    invitation.status = 'accepted';
    invitation.acceptedBy = user._id;
    invitation.acceptedAt = new Date();
    await invitation.save();

    // Create JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        company: invitation.company._id
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      message: `Welcome to ${invitation.company.displayName}!`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      company: {
        id: invitation.company._id,
        name: invitation.company.name,
        displayName: invitation.company.displayName
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

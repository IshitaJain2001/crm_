const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Company = require("../models/Company");
const Invitation = require("../models/Invitation");
const EmailVerification = require("../models/EmailVerification");
const Website = require("../models/Website");
const {
  sendOTPEmail,
  verifyOTP,
  sendInvitationEmail,
} = require("../services/otpService");
const { sendWelcomeEmail } = require("../services/emailService");
const { authMiddleware } = require("../middleware/roleAuth");

const router = express.Router();

// ============================================================
// STEP 1: Send OTP to Email (First Step of Registration)
// ============================================================
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Check if email already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Send OTP
    const result = await sendOTPEmail(email);

    res.json({
      message: "OTP sent to your email",
      verificationToken: result.verificationToken,
      expiresIn: "10 minutes",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// STEP 2: Verify OTP
// ============================================================
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    // Verify OTP
    const result = await verifyOTP(email, otp);

    res.json({
      message: "Email verified successfully",
      verified: true,
      verificationToken: result.verificationToken,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================
// STEP 3: Create Company & Register Super Admin
// ============================================================
router.post("/register-company", async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      companyName,
      displayName,
      industry,
      verificationToken,
    } = req.body;

    console.log("=== REGISTRATION REQUEST ===");
    console.log("Email:", email);
    console.log("Name:", name);
    console.log("Company:", companyName);
    console.log("Industry:", industry);
    console.log(
      "Verification Token:",
      verificationToken ? "✓ Present" : "✗ Missing",
    );
    console.log("============================");

    // Validate inputs
    if (!email || !password || !name || !companyName || !verificationToken) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    // Verify that email was verified via OTP
    const verification = await EmailVerification.findOne({
      email,
      verificationToken,
      verified: true,
    });

    if (!verification) {
      return res
        .status(400)
        .json({ error: "Email not verified. Please verify OTP first." });
    }

    // Check if email already registered (case-insensitive)
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        error: `Email "${email}" is already registered. Please use a different email or login instead.`,
        code: "EMAIL_ALREADY_REGISTERED",
      });
    }

    // Check if company name already exists (case-insensitive)
    const existingCompany = await Company.findOne({
      name: { $regex: `^${companyName}$`, $options: "i" },
    });
    if (existingCompany) {
      return res.status(400).json({
        error: `Company name "${companyName}" is already taken. Please choose a different name.`,
        code: "COMPANY_NAME_TAKEN",
      });
    }

    // Validate all required fields
    if (!email || !password || !name || !companyName) {
      return res.status(400).json({
        error: "Email, password, name, and company name are required",
      });
    }

    if (!industry) {
      return res.status(400).json({
        error: "Please select your business type/industry",
      });
    }

    // CREATE COMPANY
    const company = new Company({
      name: companyName,
      displayName: displayName || companyName,
      industry: industry || "generic",
    });

    // CREATE USER (Super Admin for this company)
    const user = new User({
      name,
      email,
      password,
      company: company._id,
      role: "superadmin",
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });

    // Set super admin reference
    company.superAdmin = user._id;
    company.members.push(user._id);

    // Save company first
    console.log("Saving company...");
    await company.save();
    console.log("✓✓✓ COMPANY CREATED SUCCESSFULLY ✓✓✓");
    console.log("Company ID:", company._id.toString());
    console.log("Company Name:", company.name);
    console.log("Company Industry:", company.industry);

    // Save user
    console.log("Saving user...");
    await user.save();
    console.log("✓✓✓ USER CREATED SUCCESSFULLY ✓✓✓");
    console.log("User ID:", user._id.toString());
    console.log("User Email:", user.email);
    console.log("User Company Reference:", user.company.toString());

    // Verify both were created
    if (!company._id || !user._id) {
      console.error("❌ CRITICAL: IDs not generated", {
        companyId: company._id,
        userId: user._id,
      });
      throw new Error("Failed to create company or user - IDs not generated");
    }

    // CREATE DEFAULT WEBSITE
    console.log("Creating default website...");
    const defaultWebsite = new Website({
      company: company._id,
      title: company.name,
      description: `Welcome to ${company.name}`,
      sections: [
        {
          id: `hero-${Date.now()}`,
          type: "hero",
          title: `Welcome to ${company.name}`,
          content: "Your company description goes here",
          order: 1,
          backgroundColor: "#3b82f6",
          textColor: "#ffffff",
          items: [],
        },
      ],
      colors: {
        primary: "#3b82f6",
        secondary: "#10b981",
        accent: "#f59e0b",
      },
      isPublished: false,
    });

    await defaultWebsite.save();
    console.log("✓✓✓ DEFAULT WEBSITE CREATED ✓✓✓");
    console.log("Website ID:", defaultWebsite._id.toString());

    if (!user.company) {
      console.error("❌ CRITICAL: User company reference not set");
      throw new Error("User company reference not set");
    }

    // Final verification - check if company exists in DB
    const verifyCompany = await Company.findById(company._id);
    if (!verifyCompany) {
      console.error("❌ CRITICAL: Company not found in database after save!", {
        companyId: company._id.toString(),
      });
      throw new Error(
        "Company not found in database after save - database error",
      );
    }
    console.log("✓ Company verified in database");

    // Create JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        company: company._id,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "7d" },
    );

    // Send welcome email
    try {
      await sendWelcomeEmail(user);
    } catch (emailError) {
      console.error("Welcome email failed:", emailError);
    }

    // Clean up verification record
    await EmailVerification.deleteOne({ email, verificationToken });

    res.status(201).json({
      message: `Welcome! You are now Super Admin of ${displayName || companyName}`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: company._id,
      },
      company: {
        id: company._id,
        name: company.name,
        displayName: company.displayName,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================
// STEP 4: Login (Email + Password)
// ============================================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user (any company)
    const user = await User.findOne({ email })
      .select("+password")
      .populate("company");

    if (!user || !user.emailVerified) {
      return res
        .status(401)
        .json({ error: "Invalid credentials or email not verified" });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if user is active
    if (!user.active) {
      return res.status(403).json({ error: "User account is inactive" });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Ensure company is populated
    if (!user.company) {
      console.warn("User has no company assigned:", user._id);
      return res.status(500).json({ error: "User company not found" });
    }

    // Create token (includes company)
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        company: user.company._id || user.company,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "7d" },
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company._id,
      },
      company: {
        id: user.company._id,
        name: user.company.name,
        displayName: user.company.displayName,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// STEP 5: Accept Invitation (User joins company)
// ============================================================
router.post("/accept-invitation/:token", async (req, res) => {
  try {
    const { email, password, name, invitationToken } = req.body;
    const { token } = req.params;

    if (!email || !password || !name || !invitationToken) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Find invitation
    const invitation = await Invitation.findOne({
      invitationToken: token,
      email,
      status: "pending",
    }).populate("company");

    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found or expired" });
    }

    // Check if expired
    if (invitation.expiresAt < new Date()) {
      invitation.status = "expired";
      await invitation.save();
      return res.status(400).json({ error: "Invitation has expired" });
    }

    // Check if user already exists in any company
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Verify email first (optional - can send OTP here too)
    const verification = await EmailVerification.findOne({
      email,
      verified: true,
    });

    if (!verification && true) {
      // Set to false if you want to skip email verification for invitations
      // Could send OTP here, but for now we'll skip for invitations
    }

    // Create user in the company
    const user = new User({
      name,
      email,
      password,
      company: invitation.company._id,
      role: invitation.role,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      invitationToken: invitation._id,
    });

    await user.save();

    // Add to company members
    invitation.company.members.push(user._id);
    await invitation.company.save();

    // Mark invitation as accepted
    invitation.status = "accepted";
    invitation.acceptedBy = user._id;
    invitation.acceptedAt = new Date();
    await invitation.save();

    // Create token
    const loginToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        company: invitation.company._id,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "7d" },
    );

    // Send welcome email
    try {
      await sendWelcomeEmail(user);
    } catch (emailError) {
      console.error("Welcome email failed:", emailError);
    }

    res.json({
      message: `Welcome to ${invitation.company.displayName}!`,
      token: loginToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: invitation.company._id,
      },
      company: {
        id: invitation.company._id,
        name: invitation.company.name,
        displayName: invitation.company.displayName,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================
// Get current user
// ============================================================
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("company")
      .select("-password");

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Validate token - lightweight check for user/company deletion
// ============================================================
router.get("/validate", authMiddleware, async (req, res) => {
  try {
    // Check if user still exists
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({
        error:
          "Your account has been deleted. Please contact support or register again.",
        code: "ACCOUNT_DELETED",
      });
    }

    // Check if company still exists (if user belongs to a company)
    if (req.user.company) {
      const company = await Company.findById(req.user.company);
      if (!company) {
        return res.status(401).json({
          error:
            "Your workspace has been deleted. Please create a new company or register again.",
          code: "COMPANY_DELETED",
        });
      }
    }

    // User and company are valid
    res.json({ valid: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Forgot Password - Send reset link
// ============================================================
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists or not (security best practice)
      return res.status(200).json({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      });
    }

    // Generate reset token (valid for 1 hour)
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Save reset token to user (hashed)
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour in milliseconds
    await user.save();
    
    console.log('Password reset token generated for user:', user._id);

    // Send reset email
    try {
      const { sendPasswordResetEmail } = require('../services/emailService');
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      await sendPasswordResetEmail(user, resetLink);
    } catch (emailError) {
      console.error('Password reset email failed:', emailError);
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      return res.status(500).json({ error: 'Failed to send reset email' });
    }

    res.json({ 
      message: 'If an account with that email exists, a password reset link has been sent.' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Reset Password
// ============================================================
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Token and passwords are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const crypto = require('crypto');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with matching reset token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      console.error('Token verification failed - Token not found or expired');
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    console.log('Token verified successfully for user:', user._id);

    // Update password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

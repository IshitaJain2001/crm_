const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Company = require("../models/Company");
const Invitation = require("../models/Invitation");
const EmailVerification = require("../models/EmailVerification");
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
      verificationToken,
    } = req.body;

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

    // Check if company name already exists
    const existingCompany = await Company.findOne({ name: companyName });
    if (existingCompany) {
      return res.status(400).json({ error: "Company name already taken" });
    }

    // Check if email already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // CREATE COMPANY
    const company = new Company({
      name: companyName,
      displayName: displayName || companyName,
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

    // Save both
    await company.save();
    await user.save();

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

module.exports = router;

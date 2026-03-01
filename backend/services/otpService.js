const crypto = require('crypto');
const EmailVerification = require('../models/EmailVerification');
const { transporter } = require('./emailService');

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Send OTP email
const sendOTPEmail = async (email) => {
  try {
    // Check if user is blocked (too many attempts)
    let verification = await EmailVerification.findOne({ email });
    
    if (verification && verification.blocked) {
      if (verification.blockedUntil > new Date()) {
        throw new Error('Too many attempts. Try again later.');
      } else {
        // Unblock
        verification.blocked = false;
        verification.attemptCount = 0;
      }
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const verificationToken = generateVerificationToken();

    // Save OTP to database
    const emailDoc = await EmailVerification.findOneAndUpdate(
      { email },
      {
        email,
        otp,
        otpExpiry,
        verificationToken,
        verified: false,
        attemptCount: 0,
        blocked: false
      },
      { upsert: true, new: true }
    );

    // Send OTP email
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Your CRM Registration OTP',
      html: `
        <h2>Email Verification</h2>
        <p>Your OTP for CRM registration is:</p>
        <h3 style="color: #007bff; font-size: 32px; letter-spacing: 5px;">
          ${otp}
        </h3>
        <p>This OTP will expire in 10 minutes.</p>
        <p><strong>Do not share this OTP with anyone.</strong></p>
        <br>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ OTP sent to ${email}`);

    return {
      success: true,
      message: 'OTP sent to your email',
      verificationToken
    };
  } catch (error) {
    console.error('Error sending OTP:', error.message);
    throw error;
  }
};

// Verify OTP
const verifyOTP = async (email, otp) => {
  try {
    const verification = await EmailVerification.findOne({ email });

    if (!verification) {
      throw new Error('No OTP found for this email');
    }

    // Check if blocked
    if (verification.blocked) {
      throw new Error('Too many attempts. Try again later.');
    }

    // Check if OTP expired
    if (verification.otpExpiry < new Date()) {
      throw new Error('OTP expired. Request a new one.');
    }

    // Check if OTP matches
    if (verification.otp !== otp) {
      verification.attemptCount += 1;

      // Block after 5 attempts
      if (verification.attemptCount >= verification.maxAttempts) {
        verification.blocked = true;
        verification.blockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }

      await verification.save();
      throw new Error(`Invalid OTP. ${verification.maxAttempts - verification.attemptCount} attempts remaining.`);
    }

    // Mark as verified
    verification.verified = true;
    verification.attemptCount = 0;
    await verification.save();

    return {
      success: true,
      message: 'Email verified successfully',
      verificationToken: verification.verificationToken
    };
  } catch (error) {
    console.error('Error verifying OTP:', error.message);
    throw error;
  }
};

// Send invitation email
const sendInvitationEmail = async (invitedEmail, companyName, invitationLink, invitedByName) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: invitedEmail,
      subject: `You've been invited to join ${companyName}`,
      html: `
        <h2>You're Invited to ${companyName}!</h2>
        <p>Hi,</p>
        <p><strong>${invitedByName}</strong> has invited you to join their CRM workspace: <strong>${companyName}</strong></p>
        <p>Click the link below to accept the invitation:</p>
        <p><a href="${invitationLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accept Invitation</a></p>
        <p>Or copy this link: ${invitationLink}</p>
        <p><strong>This invitation expires in 7 days.</strong></p>
        <br>
        <p>If you didn't expect this invitation, you can safely ignore this email.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ Invitation sent to ${invitedEmail}`);

    return {
      success: true,
      message: 'Invitation sent successfully'
    };
  } catch (error) {
    console.error('Error sending invitation:', error.message);
    throw error;
  }
};

module.exports = {
  generateOTP,
  generateVerificationToken,
  sendOTPEmail,
  verifyOTP,
  sendInvitationEmail
};

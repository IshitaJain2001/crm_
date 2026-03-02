const express = require("express");
const Feedback = require("../models/Feedback");
const Company = require("../models/Company");
const User = require("../models/User");
const { authMiddleware, superAdminOnly } = require("../middleware/roleAuth");
const { sendFeedbackNotificationEmail, sendFeedbackConfirmationEmail } = require("../services/emailService");

const router = express.Router();

// ============================================================
// Submit Feedback (Superadmin only)
// ============================================================
router.post("/submit", authMiddleware, superAdminOnly, async (req, res) => {
  try {
    const { rating, category, subject, message } = req.body;

    // Validate inputs
    if (!rating || !subject || !message) {
      return res
        .status(400)
        .json({ error: "Rating, subject, and message are required" });
    }

    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ error: "Rating must be between 1 and 5" });
    }

    if (subject.length < 5) {
      return res
        .status(400)
        .json({ error: "Subject must be at least 5 characters" });
    }

    if (message.length < 10) {
      return res
        .status(400)
        .json({ error: "Message must be at least 10 characters" });
    }

    // Get user's company
    const company = await Company.findOne({ superAdmin: req.user.id });
    if (!company) {
      return res
        .status(404)
        .json({ error: "No company found under your admin" });
    }

    // Create feedback
    const feedback = new Feedback({
      company: company._id,
      superAdmin: req.user.id,
      email: req.user.email,
      companyName: company.name,
      rating,
      category: category || "general",
      subject,
      message,
    });

    await feedback.save();

    // Get superadmin user details
    const superAdmin = await User.findById(req.user.id);

    // Send emails asynchronously (don't wait for them)
    try {
      // Send notification to admin team
      await sendFeedbackNotificationEmail(feedback);

      // Send confirmation to superadmin
      if (superAdmin) {
        await sendFeedbackConfirmationEmail(superAdmin, feedback);
      }
    } catch (emailError) {
      console.error("Email sending error (non-blocking):", emailError.message);
      // Don't fail the feedback submission if emails fail
    }

    res.status(201).json({
      message: "Thank you for your feedback! We appreciate your input. Confirmation email has been sent.",
      feedback: {
        id: feedback._id,
        rating: feedback.rating,
        category: feedback.category,
        subject: feedback.subject,
        submittedAt: feedback.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Get All Feedback for Superadmin (their own feedback)
// ============================================================
router.get("/my-feedback", authMiddleware, superAdminOnly, async (req, res) => {
  try {
    const feedback = await Feedback.find({
      superAdmin: req.user.id,
    })
      .sort({ createdAt: -1 })
      .select("-__v");

    const stats = {
      total: feedback.length,
      new: feedback.filter((f) => f.status === "new").length,
      reviewed: feedback.filter((f) => f.status === "reviewed").length,
      inProgress: feedback.filter((f) => f.status === "in_progress").length,
      resolved: feedback.filter((f) => f.status === "resolved").length,
      avgRating:
        feedback.length > 0
          ? (
              feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length
            ).toFixed(2)
          : 0,
    };

    res.json({
      feedback,
      stats,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Get Single Feedback
// ============================================================
router.get("/:id", authMiddleware, superAdminOnly, async (req, res) => {
  try {
    const feedback = await Feedback.findOne({
      _id: req.params.id,
      superAdmin: req.user.id,
    });

    if (!feedback) {
      return res.status(404).json({ error: "Feedback not found" });
    }

    res.json(feedback);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

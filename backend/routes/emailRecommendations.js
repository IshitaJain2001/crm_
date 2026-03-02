const express = require("express");
const EmailTemplate = require("../models/EmailTemplate");
const Company = require("../models/Company");
const { authMiddleware } = require("../middleware/roleAuth");
const {
  getEmailTemplateRecommendation,
  getFollowUpTiming,
} = require("../services/emailRecommendationService");

const router = express.Router();

// ============================================================
// Get Email Template Recommendations for a Contact
// ============================================================
router.get(
  "/templates/recommend/:contactId",
  authMiddleware,
  async (req, res) => {
    try {
      const company = await Company.findOne({ superAdmin: req.user.id });

      if (!company) {
        return res
          .status(404)
          .json({ error: "No company found under your admin" });
      }

      const recommendations = await getEmailTemplateRecommendation(
        req.params.contactId,
        company._id
      );

      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================
// Get Optimal Follow-up Timing for a Contact
// ============================================================
router.get("/timing/:contactId", authMiddleware, async (req, res) => {
  try {
    const company = await Company.findOne({ superAdmin: req.user.id });

    if (!company) {
      return res
        .status(404)
        .json({ error: "No company found under your admin" });
    }

    const timing = await getFollowUpTiming(req.params.contactId, company._id);

    res.json(timing);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Get All Email Templates
// ============================================================
router.get("/templates", authMiddleware, async (req, res) => {
  try {
    const company = await Company.findOne({ superAdmin: req.user.id });

    if (!company) {
      return res
        .status(404)
        .json({ error: "No company found under your admin" });
    }

    const templates = await EmailTemplate.find({
      $or: [{ company: company._id }, { isDefault: true }],
    }).sort({ successRate: -1 });

    res.json({
      templates,
      total: templates.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Get Email Templates by Category
// ============================================================
router.get("/templates/category/:category", authMiddleware, async (req, res) => {
  try {
    const company = await Company.findOne({ superAdmin: req.user.id });

    if (!company) {
      return res
        .status(404)
        .json({ error: "No company found under your admin" });
    }

    const templates = await EmailTemplate.find({
      category: req.params.category,
      $or: [{ company: company._id }, { isDefault: true }],
    }).sort({ successRate: -1 });

    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Create Custom Email Template
// ============================================================
router.post("/templates/create", authMiddleware, async (req, res) => {
  try {
    const { name, subject, body, category, dealStage, variables } = req.body;

    const company = await Company.findOne({ superAdmin: req.user.id });

    if (!company) {
      return res
        .status(404)
        .json({ error: "No company found under your admin" });
    }

    if (!name || !subject || !body || !category) {
      return res
        .status(400)
        .json({ error: "Name, subject, body, and category are required" });
    }

    const template = new EmailTemplate({
      company: company._id,
      name,
      subject,
      body,
      category,
      dealStage: dealStage || "all",
      variables: variables || [],
      createdBy: req.user.id,
    });

    await template.save();

    res.status(201).json({
      message: "Template created successfully",
      template,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Update Email Template
// ============================================================
router.put("/templates/:id", authMiddleware, async (req, res) => {
  try {
    const { name, subject, body, category, dealStage } = req.body;

    const template = await EmailTemplate.findByIdAndUpdate(
      req.params.id,
      { name, subject, body, category, dealStage },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    res.json({
      message: "Template updated successfully",
      template,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Delete Email Template
// ============================================================
router.delete("/templates/:id", authMiddleware, async (req, res) => {
  try {
    await EmailTemplate.findByIdAndRemove(req.params.id);

    res.json({
      message: "Template deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

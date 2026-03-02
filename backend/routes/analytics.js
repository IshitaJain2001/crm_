const express = require("express");
const Analytics = require("../models/Analytics");
const Company = require("../models/Company");
const { authMiddleware } = require("../middleware/roleAuth");
const { calculateAnalytics } = require("../services/analyticsService");

const router = express.Router();

// ============================================================
// Get Company Analytics (with automatic calculation)
// ============================================================
router.get("/company", authMiddleware, async (req, res) => {
  try {
    const company = await Company.findOne({ superAdmin: req.user.id });

    if (!company) {
      return res
        .status(404)
        .json({ error: "No company found under your admin" });
    }

    // Check if analytics need refresh (older than 1 hour)
    let analytics = await Analytics.findOne({ company: company._id });

    if (!analytics || new Date() - analytics.lastUpdated > 60 * 60 * 1000) {
      // Recalculate if not found or too old
      analytics = await calculateAnalytics(company._id);
    }

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Refresh Analytics (force recalculation)
// ============================================================
router.post("/refresh", authMiddleware, async (req, res) => {
  try {
    const company = await Company.findOne({ superAdmin: req.user.id });

    if (!company) {
      return res
        .status(404)
        .json({ error: "No company found under your admin" });
    }

    const analytics = await calculateAnalytics(company._id);

    res.json({
      message: "Analytics refreshed successfully",
      analytics,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Get Revenue Analytics
// ============================================================
router.get("/revenue", authMiddleware, async (req, res) => {
  try {
    const company = await Company.findOne({ superAdmin: req.user.id });

    if (!company) {
      return res
        .status(404)
        .json({ error: "No company found under your admin" });
    }

    const analytics = await Analytics.findOne({ company: company._id }).select(
      "totalRevenue revenueThisMonth revenueThisQuarter revenueThisYear revenueGrowth revenueByMonth"
    );

    res.json(analytics || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Get Sales Pipeline Analytics
// ============================================================
router.get("/pipeline", authMiddleware, async (req, res) => {
  try {
    const company = await Company.findOne({ superAdmin: req.user.id });

    if (!company) {
      return res
        .status(404)
        .json({ error: "No company found under your admin" });
    }

    const analytics = await Analytics.findOne({ company: company._id }).select(
      "totalDeals openDeals closedDeals wonDeals lostDeals avgDealSize dealClosureRate avgSalesCycle pipelineByStage"
    );

    res.json(analytics || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Get Team Performance Analytics
// ============================================================
router.get("/team-performance", authMiddleware, async (req, res) => {
  try {
    const company = await Company.findOne({ superAdmin: req.user.id });

    if (!company) {
      return res
        .status(404)
        .json({ error: "No company found under your admin" });
    }

    const analytics = await Analytics.findOne({ company: company._id }).select(
      "totalEmployees activeEmployees topPerformers totalActivities activitiesThisMonth avgActivitiesPerDay"
    );

    res.json(analytics || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Get Task Analytics
// ============================================================
router.get("/tasks", authMiddleware, async (req, res) => {
  try {
    const company = await Company.findOne({ superAdmin: req.user.id });

    if (!company) {
      return res
        .status(404)
        .json({ error: "No company found under your admin" });
    }

    const analytics = await Analytics.findOne({ company: company._id }).select(
      "totalTasks completedTasks overdueTasks taskCompletionRate"
    );

    res.json(analytics || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Get Contact Analytics
// ============================================================
router.get("/contacts", authMiddleware, async (req, res) => {
  try {
    const company = await Company.findOne({ superAdmin: req.user.id });

    if (!company) {
      return res
        .status(404)
        .json({ error: "No company found under your admin" });
    }

    const analytics = await Analytics.findOne({ company: company._id }).select(
      "totalContacts activeContacts contactConversionRate contactsAddedThisMonth"
    );

    res.json(analytics || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

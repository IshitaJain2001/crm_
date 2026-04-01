const express = require("express");
const Company = require("../models/Company");
const User = require("../models/User");
const { authMiddleware, companyLeadOnly } = require("../middleware/roleAuth");

const router = express.Router();

// ============================================================
// Get current workspace company
// ============================================================
router.get("/company", authMiddleware, async (req, res) => {
  try {
    const company = await Company.findById(req.user.company)
      .populate("superAdmin", "name email")
      .populate("members", "name email role");

    if (!company) {
      return res.status(404).json({ error: "Workspace not found" });
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
        createdAt: company.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Get workspace members (only active colleagues, exclude self)
// ============================================================
router.get("/members", authMiddleware, async (req, res) => {
  try {
    // Check if user has a company assigned
    if (!req.user.company) {
      console.warn(
        `User ${req.user.id} (${req.user.email}) has no company assigned in JWT`,
      );
      return res.status(400).json({
        error: "No workspace found. Please create or join a company first.",
        debug: {
          userCompanyFromJWT: req.user.company,
          userId: req.user.id,
          userEmail: req.user.email,
        },
        members: [],
        totalMembers: 0,
        maxUsers: 0,
      });
    }

    console.log(`Fetching company ${req.user.company} for user ${req.user.id}`);

    const company = await Company.findById(req.user.company).populate(
      "members",
      "id name email role department active",
    );

    if (!company) {
      // Company doesn't exist - either deleted or never existed
      console.error(`❌ Company NOT FOUND in database`, {
        companyId: req.user.company,
        userId: req.user.id,
        userEmail: req.user.email,
      });

      // Check if company ever existed
      const allCompanies = await Company.countDocuments();
      console.error(`Total companies in database: ${allCompanies}`);

      return res.status(404).json({
        error:
          "Your workspace does not exist in the database. This usually means registration failed to create the company.",
        debug: {
          companyId: req.user.company,
          userId: req.user.id,
          userEmail: req.user.email,
          totalCompaniesInDB: allCompanies,
          suggestion:
            "Please register again and check backend logs for 'Company created' message.",
        },
        members: [],
        totalMembers: 0,
        maxUsers: 0,
      });
    }

    console.log(`✓ Company found: ${company.name} (${company._id})`);

    // Filter out inactive members and current user
    const activeMembers = (company.members || []).filter(
      (member) => member.active && member._id.toString() !== req.user.id,
    );

    res.json({
      members: activeMembers,
      totalMembers: activeMembers.length,
      maxUsers: company.maxUsers,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      members: [],
      totalMembers: 0,
    });
  }
});

// ============================================================
// Update workspace company (Super Admin only)
// ============================================================
router.put("/company", authMiddleware, companyLeadOnly, async (req, res) => {
  try {
    const { displayName, plan } = req.body;

    const company = await Company.findByIdAndUpdate(
      req.user.company,
      {
        ...(displayName && { displayName }),
        ...(plan && { plan }),
      },
      { new: true, runValidators: true },
    );

    res.json({
      message: "Workspace updated successfully",
      company: {
        id: company._id,
        name: company.name,
        displayName: company.displayName,
        plan: company.plan,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================
// Remove member from workspace (Super Admin only)
// ============================================================
router.delete(
  "/members/:userId",
  authMiddleware,
  companyLeadOnly,
  async (req, res) => {
    try {
      const { userId } = req.params;

      // Cannot remove yourself
      if (userId === req.user.id) {
        return res.status(403).json({ error: "Cannot remove yourself" });
      }

      // Remove user from company members
      const company = await Company.findByIdAndUpdate(
        req.user.company,
        { $pull: { members: userId } },
        { new: true },
      );

      // Deactivate user
      await User.findByIdAndUpdate(userId, { active: false });

      res.json({
        message: "Member removed from workspace",
        company,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

module.exports = router;

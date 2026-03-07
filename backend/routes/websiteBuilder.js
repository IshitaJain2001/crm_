const express = require("express");
const Website = require("../models/Website");
const Company = require("../models/Company");
const { authMiddleware, superAdminOnly } = require("../middleware/roleAuth");

const router = express.Router();

// ============================================================
// Get or Create Website for Company
// ============================================================
router.get("/my-website", authMiddleware, superAdminOnly, async (req, res) => {
  try {
    const company = await Company.findOne({ superAdmin: req.user.id });

    if (!company) {
      return res
        .status(404)
        .json({ error: "No company found under your admin" });
    }

    let website = await Website.findOne({ company: company._id });

    if (!website) {
      // Create default website
      website = new Website({
        company: company._id,
        title: company.name,
        description: `Welcome to ${company.name}`,
        sections: [
          {
            id: "hero-1",
            type: "hero",
            title: "Welcome to " + company.name,
            content: "Your company description goes here",
            order: 1,
            backgroundColor: "#3b82f6",
            textColor: "#ffffff",
          },
        ],
      });

      await website.save();
    }

    res.json(website);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Update Website Section
// ============================================================
router.put("/section/:sectionId", authMiddleware, superAdminOnly, async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { title, content, backgroundColor, textColor, items } = req.body;

    const company = await Company.findOne({ superAdmin: req.user.id });

    if (!company) {
      return res
        .status(404)
        .json({ error: "No company found under your admin" });
    }

    const website = await Website.findOne({ company: company._id });

    if (!website) {
      return res.status(404).json({ error: "Website not found" });
    }

    // Find and update section
    const sectionIndex = website.sections.findIndex((s) => s.id === sectionId);

    if (sectionIndex === -1) {
      return res.status(404).json({ error: "Section not found" });
    }

    website.sections[sectionIndex] = {
      ...website.sections[sectionIndex],
      title: title || website.sections[sectionIndex].title,
      content: content || website.sections[sectionIndex].content,
      backgroundColor:
        backgroundColor || website.sections[sectionIndex].backgroundColor,
      textColor: textColor || website.sections[sectionIndex].textColor,
      items: items || website.sections[sectionIndex].items,
      updatedAt: new Date(),
    };

    await website.save();

    res.json({
      message: "Section updated successfully",
      website,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Add New Section
// ============================================================
router.post("/section", authMiddleware, superAdminOnly, async (req, res) => {
  try {
    const { type, title, content } = req.body;

    if (!type || !title) {
      return res
        .status(400)
        .json({ error: "Section type and title are required" });
    }

    const company = await Company.findOne({ superAdmin: req.user.id });

    if (!company) {
      return res
        .status(404)
        .json({ error: "No company found under your admin" });
    }

    const website = await Website.findOne({ company: company._id });

    if (!website) {
      return res.status(404).json({ error: "Website not found" });
    }

    const newSection = {
      id: `${type}-${Date.now()}`,
      type,
      title,
      content: content || "",
      order: website.sections.length + 1,
      backgroundColor: "#ffffff",
      textColor: "#000000",
      items: [],
    };

    website.sections.push(newSection);
    await website.save();

    res.status(201).json({
      message: "Section added successfully",
      section: newSection,
      website,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Delete Section
// ============================================================
router.delete("/section/:sectionId", authMiddleware, superAdminOnly, async (req, res) => {
  try {
    const { sectionId } = req.params;

    const company = await Company.findOne({ superAdmin: req.user.id });

    if (!company) {
      return res
        .status(404)
        .json({ error: "No company found under your admin" });
    }

    const website = await Website.findOne({ company: company._id });

    if (!website) {
      return res.status(404).json({ error: "Website not found" });
    }

    website.sections = website.sections.filter((s) => s.id !== sectionId);
    await website.save();

    res.json({
      message: "Section deleted successfully",
      website,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Reorder Sections
// ============================================================
router.post("/reorder", authMiddleware, superAdminOnly, async (req, res) => {
  try {
    const { sectionIds } = req.body;

    if (!Array.isArray(sectionIds)) {
      return res.status(400).json({ error: "Invalid section order" });
    }

    const company = await Company.findOne({ superAdmin: req.user.id });

    if (!company) {
      return res
        .status(404)
        .json({ error: "No company found under your admin" });
    }

    const website = await Website.findOne({ company: company._id });

    if (!website) {
      return res.status(404).json({ error: "Website not found" });
    }

    // Reorder sections
    const reorderedSections = sectionIds.map((id, index) => {
      const section = website.sections.find((s) => s.id === id);
      if (section) {
        section.order = index + 1;
      }
      return section;
    });

    website.sections = reorderedSections.filter((s) => s !== undefined);
    await website.save();

    res.json({
      message: "Sections reordered successfully",
      website,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Update Website Colors
// ============================================================
router.put("/colors", authMiddleware, superAdminOnly, async (req, res) => {
  try {
    const { primary, secondary, accent } = req.body;

    const company = await Company.findOne({ superAdmin: req.user.id });

    if (!company) {
      return res
        .status(404)
        .json({ error: "No company found under your admin" });
    }

    const website = await Website.findOne({ company: company._id });

    if (!website) {
      return res.status(404).json({ error: "Website not found" });
    }

    if (primary) website.colors.primary = primary;
    if (secondary) website.colors.secondary = secondary;
    if (accent) website.colors.accent = accent;

    await website.save();

    res.json({
      message: "Colors updated successfully",
      colors: website.colors,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Update Full Website (Auto-save)
// ============================================================
router.put("/update-full", authMiddleware, superAdminOnly, async (req, res) => {
  try {
    let { title, description, sections, colors, isPublished } = req.body;

    // Parse sections if it's a string
    if (typeof sections === "string") {
      try {
        sections = JSON.parse(sections);
      } catch (e) {
        return res.status(400).json({ error: "Invalid sections format" });
      }
    }

    // Validate sections is an array
    if (!Array.isArray(sections)) {
      sections = [];
    }

    const company = await Company.findOne({ superAdmin: req.user.id });

    if (!company) {
      return res
        .status(404)
        .json({ error: "No company found under your admin" });
    }

    let website = await Website.findOne({ company: company._id });

    if (!website) {
      // Create new website if doesn't exist
      website = new Website({
        company: company._id,
        title: title || "Untitled Website",
      });
    }

    // Update website fields
    if (title) website.title = title;
    if (description) website.description = description;
    
    // Ensure sections is properly formatted
    website.sections = Array.isArray(sections) ? sections : [];
    
    if (colors) website.colors = colors;
    if (isPublished !== undefined) website.isPublished = isPublished;

    await website.save();

    res.json({
      message: "Website updated successfully",
      website,
    });
  } catch (error) {
    console.error("Website update error:", error.message);
    res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
});

// ============================================================
// Publish Website
// ============================================================
router.post("/publish", authMiddleware, superAdminOnly, async (req, res) => {
  try {
    const company = await Company.findOne({ superAdmin: req.user.id });

    if (!company) {
      return res
        .status(404)
        .json({ error: "No company found under your admin" });
    }

    const website = await Website.findOne({ company: company._id });

    if (!website) {
      return res.status(404).json({ error: "Website not found" });
    }

    website.isPublished = true;
    website.publishedUrl = `https://crm-websites.example.com/${company._id}`;

    await website.save();

    res.json({
      message: "Website published successfully",
      publishedUrl: website.publishedUrl,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

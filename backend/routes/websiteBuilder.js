const express = require("express");
const Website = require("../models/Website");
const Company = require("../models/Company");
const Contact = require("../models/Contact");
const { authMiddleware, companyLeadOnly } = require("../middleware/roleAuth");
const crypto = require("crypto");

const router = express.Router();

// Generate API Key
function generateAPIKey() {
  return "crm_" + crypto.randomBytes(32).toString("hex");
}

// Generate API Secret
function generateAPISecret() {
  return crypto.randomBytes(32).toString("hex");
}

// ============================================================
// Get or Create Website for Company
// ============================================================
router.get("/my-website", authMiddleware, companyLeadOnly, async (req, res) => {
  try {
    const company = await Company.findById(req.user.company);

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    let website = await Website.findOne({ company: company._id });

    if (!website) {
      website = new Website({
        company: company._id,
        title: company.name,
        description: `Welcome to ${company.name}`,
        sections: [],
        needsTemplateSelection: true,
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
router.put("/section/:sectionId", authMiddleware, companyLeadOnly, async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { title, content, backgroundColor, textColor, items } = req.body;

    const company = await Company.findById(req.user.company);

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
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
router.post("/section", authMiddleware, companyLeadOnly, async (req, res) => {
  try {
    const { type, title, content } = req.body;

    if (!type || !title) {
      return res
        .status(400)
        .json({ error: "Section type and title are required" });
    }

    const company = await Company.findById(req.user.company);

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
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
router.delete("/section/:sectionId", authMiddleware, companyLeadOnly, async (req, res) => {
  try {
    const { sectionId } = req.params;

    const company = await Company.findById(req.user.company);

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
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
router.post("/reorder", authMiddleware, companyLeadOnly, async (req, res) => {
  try {
    const { sectionIds } = req.body;

    if (!Array.isArray(sectionIds)) {
      return res.status(400).json({ error: "Invalid section order" });
    }

    const company = await Company.findById(req.user.company);

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
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
router.put("/colors", authMiddleware, companyLeadOnly, async (req, res) => {
  try {
    const { primary, secondary, accent } = req.body;

    const company = await Company.findById(req.user.company);

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
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
router.put("/update-full", authMiddleware, companyLeadOnly, async (req, res) => {
  try {
    let { title, description, sections, colors, isPublished, needsTemplateSelection } =
      req.body;

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
    
    // Handle case where sections is an array with a stringified array as first element
    // e.g., ["[{...}]"] instead of [{...}]
    if (sections.length > 0 && typeof sections[0] === "string") {
      try {
        const parsed = JSON.parse(sections[0]);
        if (Array.isArray(parsed)) {
          sections = parsed;
        }
      } catch (e) {
        // If it can't be parsed, try to extract sections from the string
        console.warn("Could not parse sections[0]:", e.message);
      }
    }
    
    // Ensure all elements in sections array are objects, not strings
    sections = sections.filter(item => {
      if (typeof item === "string") {
        console.warn("Filtered out stringified section:", item.substring(0, 50));
        return false;
      }
      return true;
    });

    const company = await Company.findById(req.user.company);

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
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
    if (needsTemplateSelection !== undefined) {
      website.needsTemplateSelection = Boolean(needsTemplateSelection);
    }

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
router.post("/publish", authMiddleware, companyLeadOnly, async (req, res) => {
  try {
    const company = await Company.findById(req.user.company);

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
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

// ============================================================
// Generate API Key for Website Integration
// ============================================================
router.post(
  "/integration/generate-api-key",
  authMiddleware,
  companyLeadOnly,
  async (req, res) => {
    try {
      const company = await Company.findById(req.user.company);

      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      const website = await Website.findOne({ company: company._id });

      if (!website) {
        return res.status(404).json({ error: "Website not found" });
      }

      const apiKey = generateAPIKey();
      const apiSecret = generateAPISecret();

      website.integrations = {
        ...website.integrations,
        enabled: true,
        apiKey,
        apiSecret,
      };

      await website.save();

      res.json({
        message: "API credentials generated successfully",
        apiKey,
        apiSecret,
        // Only send secret once, on generation
        note: "Save your API secret securely. You won't be able to see it again.",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================
// Get Integration Settings (API Key only, not secret)
// ============================================================
router.get(
  "/integration/settings",
  authMiddleware,
  companyLeadOnly,
  async (req, res) => {
    try {
      const company = await Company.findById(req.user.company);

      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      const website = await Website.findOne({ company: company._id });

      if (!website) {
        return res.status(404).json({ error: "Website not found" });
      }

      res.json({
        integrations: {
          enabled: website.integrations?.enabled || false,
          apiKey: website.integrations?.apiKey || null,
          webhookUrl: website.integrations?.webhookUrl || null,
          formMappings: website.integrations?.formMappings || [],
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================
// Update Form Field Mappings
// ============================================================
router.put(
  "/integration/form-mappings",
  authMiddleware,
  companyLeadOnly,
  async (req, res) => {
    try {
      const { formMappings } = req.body;

      if (!Array.isArray(formMappings)) {
        return res.status(400).json({ error: "formMappings must be an array" });
      }

      const company = await Company.findById(req.user.company);

      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      const website = await Website.findOne({ company: company._id });

      if (!website) {
        return res.status(404).json({ error: "Website not found" });
      }

      website.integrations.formMappings = formMappings;
      await website.save();

      res.json({
        message: "Form mappings updated successfully",
        formMappings: website.integrations.formMappings,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================
// PUBLIC API: Submit Form from External Website
// Uses API Key for authentication (no user session required)
// ============================================================
router.post("/api/form-submission", async (req, res) => {
  try {
    const { apiKey, formData, source } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: "API key is required" });
    }

    // Find website by API key
    const website = await Website.findOne({ "integrations.apiKey": apiKey });

    if (!website) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    if (!website.integrations?.enabled) {
      return res.status(403).json({ error: "Integration is not enabled" });
    }

    const submissionId = crypto.randomUUID();

    // Create form submission record
    const submission = {
      submissionId,
      data: formData,
      source: source || "unknown",
      submittedAt: new Date(),
      processed: false,
    };

    website.formSubmissions.push(submission);

    // Auto-create/update contact if email mapping exists
    const emailMapping = website.integrations.formMappings?.find(
      (m) => m.crmField === "email"
    );

    if (emailMapping && formData[emailMapping.fieldName]) {
      const email = formData[emailMapping.fieldName];
      const company = await Company.findById(website.company);

      if (company) {
        // Get super admin for owner field
        const owner = company.superAdmin || company.owner;

        // Map form fields to contact fields
        const contactData = {
          email,
          company: company._id,
          owner,
        };

        // Default first and last name from form if available
        const firstNameMapping = website.integrations.formMappings?.find(
          (m) => m.crmField === "firstName"
        );
        const lastNameMapping = website.integrations.formMappings?.find(
          (m) => m.crmField === "lastName"
        );

        // Ensure first and last name are present
        contactData.firstName =
          formData[firstNameMapping?.fieldName] || email.split("@")[0];
        contactData.lastName =
          formData[lastNameMapping?.fieldName] || "Lead";

        // Map other fields
        website.integrations.formMappings?.forEach((mapping) => {
          const fieldValue = formData[mapping.fieldName];
          if (fieldValue && mapping.crmField !== "firstName") {
            // firstName already handled above
            contactData[mapping.crmField] = fieldValue;
          }
        });

        // Set lifecycle to lead
        contactData.lifecycle = "lead";

        // Find or create contact
        let contact = await Contact.findOne({
          email,
          company: company._id,
        });

        if (!contact) {
          contact = new Contact(contactData);
          await contact.save();
        } else {
          // Update existing contact with new data
          Object.assign(contact, contactData);
          await contact.save();
        }

        // Link submission to contact
        submission.linkedContact = contact._id;
        submission.processed = true;
      }
    }

    await website.save();

    res.status(201).json({
      message: "Form submission received successfully",
      submissionId,
    });
  } catch (error) {
    console.error("Form submission error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Get Form Submissions (with pagination)
// ============================================================
router.get(
  "/integration/submissions",
  authMiddleware,
  companyLeadOnly,
  async (req, res) => {
    try {
      const { page = 1, limit = 20, processed } = req.query;
      const skip = (page - 1) * limit;

      const company = await Company.findById(req.user.company);

      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      const website = await Website.findOne({ company: company._id });

      if (!website) {
        return res.status(404).json({ error: "Website not found" });
      }

      let submissions = website.formSubmissions || [];

      // Filter by processed status if provided
      if (processed !== undefined) {
        submissions = submissions.filter(
          (s) => s.processed === (processed === "true")
        );
      }

      // Sort by most recent first
      submissions.sort((a, b) => b.submittedAt - a.submittedAt);

      const total = submissions.length;
      const paginatedSubmissions = submissions.slice(skip, skip + limit);

      // Populate contact details
      const submissionsWithContacts = await Promise.all(
        paginatedSubmissions.map(async (submission) => {
          if (submission.linkedContact) {
            const contact = await Contact.findById(submission.linkedContact);
            return { ...submission.toObject(), contactDetails: contact };
          }
          return submission;
        })
      );

      res.json({
        submissions: submissionsWithContacts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================
// Mark Submission as Processed
// ============================================================
router.put(
  "/integration/submissions/:submissionId/process",
  authMiddleware,
  companyLeadOnly,
  async (req, res) => {
    try {
      const { submissionId } = req.params;

      const company = await Company.findById(req.user.company);

      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      const website = await Website.findOne({ company: company._id });

      if (!website) {
        return res.status(404).json({ error: "Website not found" });
      }

      const submission = website.formSubmissions?.find(
        (s) => s.submissionId === submissionId
      );

      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }

      submission.processed = true;
      await website.save();

      res.json({
        message: "Submission marked as processed",
        submission,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;

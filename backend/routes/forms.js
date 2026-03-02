const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const Form = require("../models/Form");
const FormSubmission = require("../models/FormSubmission");
const Contact = require("../models/Contact");
const { sendFormNotificationEmail } = require("../services/emailService");

const router = express.Router();

// ============================================================
// Create Form
// ============================================================
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      fields,
      theme,
      redirectUrl,
      successMessage,
      notifyEmail,
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Form title is required" });
    }

    const form = new Form({
      title,
      description,
      fields: fields || [],
      theme: theme || {},
      redirectUrl,
      successMessage,
      notifyEmail: notifyEmail || [],
      company: req.user.company,
      createdBy: req.user.id,
    });

    await form.save();

    res.status(201).json({
      message: "Form created successfully",
      form: {
        id: form._id,
        title: form.title,
        slug: form.slug,
        status: form.status,
      },
    });
  } catch (error) {
    console.error("Error creating form:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Get All Forms
// ============================================================
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let query = { company: req.user.company };
    if (status) query.status = status;

    const forms = await Form.find(query)
      .populate("createdBy", "name email")
      .populate("assignTo", "name email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Form.countDocuments(query);

    res.json({
      forms,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching forms:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Get Single Form
// ============================================================
router.get("/:formId", authMiddleware, async (req, res) => {
  try {
    const form = await Form.findById(req.params.formId)
      .populate("createdBy", "name email")
      .populate("assignTo", "name email");

    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    if (form.company.toString() !== req.user.company) {
      return res.status(403).json({ error: "Not authorized" });
    }

    res.json(form);
  } catch (error) {
    console.error("Error fetching form:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Get Form by Slug (Public)
// ============================================================
router.get("/public/form/:slug", async (req, res) => {
  try {
    const form = await Form.findOne({
      slug: req.params.slug,
      status: "published",
    }).select("title description fields theme successMessage redirectUrl");

    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    // Track views
    form.viewCount += 1;
    await form.save();

    res.json(form);
  } catch (error) {
    console.error("Error fetching public form:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Update Form
// ============================================================
router.put("/:formId", authMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      fields,
      theme,
      redirectUrl,
      successMessage,
      notifyEmail,
      assignTo,
      status,
    } = req.body;

    const form = await Form.findById(req.params.formId);

    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    if (form.company.toString() !== req.user.company) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Update fields
    if (title) form.title = title;
    if (description) form.description = description;
    if (fields) form.fields = fields;
    if (theme) form.theme = theme;
    if (redirectUrl) form.redirectUrl = redirectUrl;
    if (successMessage) form.successMessage = successMessage;
    if (notifyEmail) form.notifyEmail = notifyEmail;
    if (assignTo) form.assignTo = assignTo;

    // Handle status changes
    if (status && status !== form.status) {
      if (status === "published" && form.status === "draft") {
        form.published = true;
        form.publishedAt = new Date();
      } else if (status === "archived") {
        form.archivedAt = new Date();
      }
      form.status = status;
    }

    await form.save();

    res.json({
      message: "Form updated successfully",
      form,
    });
  } catch (error) {
    console.error("Error updating form:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Submit Form (Public)
// ============================================================
router.post("/:slug/submit", async (req, res) => {
  try {
    const { data } = req.body;

    const form = await Form.findOne({
      slug: req.params.slug,
      status: "published",
    }).populate("company");

    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    // Extract email and name from data
    const email = data?.email?.toLowerCase() || null;
    const name = data?.name || null;
    const phone = data?.phone || null;

    // Find or create contact
    let contact = null;
    if (email) {
      contact = await Contact.findOne({
        company: form.company._id,
        email,
      });

      if (!contact) {
        contact = new Contact({
          company: form.company._id,
          name: name || "Unknown",
          email,
          phone,
          source: "form",
          status: "new",
        });
        await contact.save();
      }
    }

    // Create form submission
    const submission = new FormSubmission({
      form: form._id,
      company: form.company._id,
      contact: contact?._id,
      data,
      email,
      name,
      phone,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      referer: req.get("referer"),
      completedAt: new Date(),
      assignedTo: form.assignTo,
    });

    await submission.save();

    // Increment submission count
    form.submissionCount += 1;
    await form.save();

    // Send notification emails
    if (form.notifyEmail && form.notifyEmail.length > 0) {
      try {
        await sendFormNotificationEmail(form, submission);
      } catch (emailError) {
        console.error(
          "Warning: Failed to send notification email:",
          emailError,
        );
      }
    }

    res.status(201).json({
      message: successMessage || form.successMessage,
      submissionId: submission._id,
      redirectUrl: form.redirectUrl,
    });
  } catch (error) {
    console.error("Error submitting form:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Get Form Submissions
// ============================================================
router.get("/:formId/submissions", authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const form = await Form.findById(req.params.formId);

    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    if (form.company.toString() !== req.user.company) {
      return res.status(403).json({ error: "Not authorized" });
    }

    let query = { form: form._id };
    if (status) query.status = status;

    const submissions = await FormSubmission.find(query)
      .populate("contact", "name email phone")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await FormSubmission.countDocuments(query);

    res.json({
      submissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Update Form Submission
// ============================================================
router.put(
  "/:formId/submissions/:submissionId",
  authMiddleware,
  async (req, res) => {
    try {
      const { status, notes, assignedTo } = req.body;

      const form = await Form.findById(req.params.formId);

      if (!form) {
        return res.status(404).json({ error: "Form not found" });
      }

      if (form.company.toString() !== req.user.company) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const submission = await FormSubmission.findById(req.params.submissionId);

      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }

      if (status) submission.status = status;
      if (notes) submission.notes = notes;
      if (assignedTo) submission.assignedTo = assignedTo;

      await submission.save();

      res.json({
        message: "Submission updated successfully",
        submission,
      });
    } catch (error) {
      console.error("Error updating submission:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// ============================================================
// Delete Form
// ============================================================
router.delete("/:formId", authMiddleware, async (req, res) => {
  try {
    const form = await Form.findById(req.params.formId);

    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    if (form.company.toString() !== req.user.company) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await Form.findByIdAndDelete(req.params.formId);

    res.json({ message: "Form deleted successfully" });
  } catch (error) {
    console.error("Error deleting form:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

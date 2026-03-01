const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const Email = require('../models/Email');
const EmailTemplate = require('../models/EmailTemplate');
const {
  sendEmailWithTracking,
  trackEmailOpen,
  trackEmailClick,
  getEmailAnalytics,
  getEmailHistory
} = require('../services/emailTrackingService');

const router = express.Router();

// ============================================================
// Send Email with Tracking
// ============================================================
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const {
      to,
      cc,
      bcc,
      subject,
      body,
      templateId,
      contact,
      deal
    } = req.body;

    // Validate recipients
    if (!to || !Array.isArray(to) || to.length === 0) {
      return res.status(400).json({ error: 'At least one recipient is required' });
    }

    if (!subject || !body) {
      return res.status(400).json({ error: 'Subject and body are required' });
    }

    // If using template, merge variables
    let emailBody = body;
    if (templateId) {
      const template = await EmailTemplate.findById(templateId);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      emailBody = template.body; // In production, merge variables
    }

    // Send email with tracking
    const result = await sendEmailWithTracking({
      from: req.user.id,
      fromEmail: req.user.email,
      to,
      cc,
      bcc,
      subject,
      body: emailBody,
      company: req.user.company,
      contact,
      deal,
      template: templateId
    });

    res.status(201).json({
      success: true,
      message: 'Email sent successfully',
      emailId: result.emailId,
      trackingId: result.trackingId
    });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Get Email History
// ============================================================
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, contact } = req.query;

    const result = await getEmailHistory(
      req.user.id,
      req.user.company,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        contact
      }
    );

    res.json(result);

  } catch (error) {
    console.error('Error fetching email history:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Get Email Analytics
// ============================================================
router.get('/:emailId/analytics', authMiddleware, async (req, res) => {
  try {
    const { emailId } = req.params;

    // Verify ownership
    const email = await Email.findById(emailId);
    if (!email || email.from.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const analytics = await getEmailAnalytics(emailId);

    if (!analytics) {
      return res.status(404).json({ error: 'Email not found' });
    }

    res.json(analytics);

  } catch (error) {
    console.error('Error fetching email analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Track Email Open (Pixel)
// ============================================================
router.get('/track/open/:pixelId', async (req, res) => {
  try {
    const { pixelId } = req.params;

    // Track the open asynchronously (don't wait)
    trackEmailOpen(pixelId, req).catch(err => console.error('Tracking error:', err));

    // Return 1x1 transparent pixel
    const pixel = Buffer.from([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00,
      0x01, 0x00, 0x80, 0x00, 0x00, 0xff, 0xff, 0xff,
      0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
      0x01, 0x00, 0x3b
    ]);

    res.set('Content-Type', 'image/gif');
    res.set('Content-Length', pixel.length);
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.end(pixel);

  } catch (error) {
    console.error('Error tracking open:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Track Email Click
// ============================================================
router.get('/track/click/:trackingId', async (req, res) => {
  try {
    const { trackingId } = req.params;
    const { link } = req.query;

    if (!link) {
      return res.status(400).json({ error: 'Link parameter required' });
    }

    // Track the click asynchronously
    trackEmailClick(trackingId, link, req).catch(err => console.error('Tracking error:', err));

    // Redirect to original link
    res.redirect(link);

  } catch (error) {
    console.error('Error tracking click:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Create Email Template
// ============================================================
router.post('/templates', authMiddleware, async (req, res) => {
  try {
    const { name, subject, body, category, variables, tags } = req.body;

    if (!name || !subject || !body) {
      return res.status(400).json({ error: 'Name, subject, and body are required' });
    }

    const template = new EmailTemplate({
      name,
      subject,
      body,
      company: req.user.company,
      createdBy: req.user.id,
      category,
      variables,
      tags
    });

    await template.save();

    res.status(201).json({
      message: 'Template created successfully',
      template
    });

  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Get Email Templates
// ============================================================
router.get('/templates', authMiddleware, async (req, res) => {
  try {
    const { category } = req.query;

    let query = { company: req.user.company };
    if (category) query.category = category;

    const templates = await EmailTemplate.find(query).sort({ createdAt: -1 });

    res.json({ templates });

  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Update Email Template
// ============================================================
router.put('/templates/:templateId', authMiddleware, async (req, res) => {
  try {
    const { templateId } = req.params;
    const { name, subject, body, category, variables, tags } = req.body;

    const template = await EmailTemplate.findByIdAndUpdate(
      templateId,
      { name, subject, body, category, variables, tags },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({
      message: 'Template updated successfully',
      template
    });

  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Delete Email Template
// ============================================================
router.delete('/templates/:templateId', authMiddleware, async (req, res) => {
  try {
    const { templateId } = req.params;

    const template = await EmailTemplate.findByIdAndDelete(templateId);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ message: 'Template deleted successfully' });

  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

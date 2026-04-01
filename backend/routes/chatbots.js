const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Chatbot = require('../models/Chatbot');
const { authMiddleware, requireRole, adminOnly } = require('../middleware/roleAuth');

// Middleware to check chatbot ownership
const checkChatbotOwnership = async (req, res, next) => {
  try {
    const chatbot = await Chatbot.findById(req.params.id);
    if (!chatbot) {
      return res.status(404).json({ message: 'Chatbot not found' });
    }
    // Use userId or company as workspace identifier
    const workspaceId = req.user.workspaceId || req.user.company || req.user.id;
    if (chatbot.workspaceId !== workspaceId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    req.chatbot = chatbot;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// CREATE - Create a new chatbot
router.post('/', authMiddleware, requireRole('admin', 'superadmin', 'hr'), async (req, res) => {
  try {
    const { name, description, widget } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Chatbot name is required' });
    }

    // Generate unique API key
    const apiKey = crypto.randomBytes(32).toString('hex');
    const workspaceId = req.user.workspaceId || req.user.company || req.user.id;

    const chatbot = new Chatbot({
      workspaceId,
      name,
      description: description || '',
      widget: widget || {},
      apiKey,
      createdBy: req.user.id
    });

    await chatbot.save();

    res.status(201).json({
      message: 'Chatbot created successfully',
      chatbot
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating chatbot', error: error.message });
  }
});

// READ - Get all chatbots for workspace
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    const workspaceId = req.user.workspaceId || req.user.company || req.user.id;
    const filter = { workspaceId };

    if (status) {
      filter.status = status;
    }

    const chatbots = await Chatbot.find(filter)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ createdAt: -1 });

    const total = await Chatbot.countDocuments(filter);

    res.json({
      chatbots,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chatbots', error: error.message });
  }
});

// READ - Get single chatbot
router.get('/:id', authMiddleware, checkChatbotOwnership, async (req, res) => {
  try {
    res.json(req.chatbot);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chatbot', error: error.message });
  }
});

// UPDATE - Update chatbot
router.put('/:id', authMiddleware, requireRole('admin', 'superadmin', 'hr'), checkChatbotOwnership, async (req, res) => {
  try {
    const { name, description, status, widget, businessHours, escalationThreshold, welcomeMessage } = req.body;

    // Update allowed fields
    if (name !== undefined) req.chatbot.name = name;
    if (description !== undefined) req.chatbot.description = description;
    if (status !== undefined) req.chatbot.status = status;
    if (widget !== undefined) req.chatbot.widget = { ...req.chatbot.widget, ...widget };
    if (businessHours !== undefined) req.chatbot.businessHours = businessHours;
    if (escalationThreshold !== undefined) req.chatbot.escalationThreshold = escalationThreshold;
    if (welcomeMessage !== undefined) req.chatbot.welcomeMessage = welcomeMessage;

    req.chatbot.lastModifiedBy = req.user.id;
    await req.chatbot.save();

    res.json({
      message: 'Chatbot updated successfully',
      chatbot: req.chatbot
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating chatbot', error: error.message });
  }
});

// DELETE - Delete chatbot
router.delete('/:id', authMiddleware, adminOnly, checkChatbotOwnership, async (req, res) => {
  try {
    await Chatbot.deleteOne({ _id: req.params.id });

    res.json({
      message: 'Chatbot deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting chatbot', error: error.message });
  }
});

// TOGGLE STATUS - Activate/Deactivate chatbot
router.patch('/:id/toggle-status', authMiddleware, requireRole('admin', 'superadmin', 'hr'), checkChatbotOwnership, async (req, res) => {
  try {
    req.chatbot.status = req.chatbot.status === 'active' ? 'inactive' : 'active';
    req.chatbot.lastModifiedBy = req.user.id;
    await req.chatbot.save();

    res.json({
      message: `Chatbot ${req.chatbot.status}`,
      chatbot: req.chatbot
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating chatbot status', error: error.message });
  }
});

// GENERATE EMBED CODE
router.post('/:id/embed-code', authMiddleware, checkChatbotOwnership, async (req, res) => {
  try {
    const { domain } = req.body;

    const embedCode = `<script src="${process.env.FRONTEND_URL || 'http://localhost:3000'}/chatbot-widget.js"></script>
<script>
  CRMChatbot.init({
    chatbotId: "${req.chatbot._id}",
    theme: "${req.chatbot.widget.theme}",
    position: "${req.chatbot.widget.position}",
    headerText: "${req.chatbot.widget.headerText}",
    domain: "${domain || ''}"
  });
</script>`;

    res.json({
      embedCode,
      instructions: 'Add this code to your website just before the closing </body> tag'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating embed code', error: error.message });
  }
});

// GET EMBED CONFIG (public endpoint - validate chatbotId only)
router.get('/embed/:chatbotId/config', async (req, res) => {
  try {
    const chatbot = await Chatbot.findById(req.params.chatbotId).select(
      'name widget status welcomeMessage initialPrompt features'
    );

    if (!chatbot) {
      return res.status(404).json({ message: 'Chatbot not found' });
    }

    res.json({
      chatbotId: chatbot._id,
      name: chatbot.name,
      widget: chatbot.widget,
      welcomeMessage: chatbot.welcomeMessage,
      initialPrompt: chatbot.initialPrompt,
      features: chatbot.features
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chatbot config', error: error.message });
  }
});

// RESET API KEY
router.post('/:id/reset-api-key', authMiddleware, adminOnly, checkChatbotOwnership, async (req, res) => {
  try {
    req.chatbot.apiKey = crypto.randomBytes(32).toString('hex');
    req.chatbot.lastModifiedBy = req.user.id;
    await req.chatbot.save();

    res.json({
      message: 'API key reset successfully',
      apiKey: req.chatbot.apiKey
    });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting API key', error: error.message });
  }
});

// TEST WEBHOOK
router.post('/:id/test-webhook', authMiddleware, checkChatbotOwnership, async (req, res) => {
  try {
    if (!req.chatbot.webhookUrl) {
      return res.status(400).json({ message: 'No webhook URL configured' });
    }

    // In production, implement actual webhook test
    res.json({
      message: 'Webhook test initiated',
      webhookUrl: req.chatbot.webhookUrl
    });
  } catch (error) {
    res.status(500).json({ message: 'Error testing webhook', error: error.message });
  }
});

// ADD FAQ - Add question & answer
router.post('/:id/faq', authMiddleware, requireRole('admin', 'superadmin', 'hr'), checkChatbotOwnership, async (req, res) => {
  try {
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ message: 'Question and answer are required' });
    }

    req.chatbot.faqs.push({ question, answer });
    await req.chatbot.save();

    res.status(201).json({
      message: 'FAQ added successfully',
      faqs: req.chatbot.faqs
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding FAQ', error: error.message });
  }
});

// GET FAQs - Get all Q&A for chatbot
router.get('/:id/faq', authMiddleware, checkChatbotOwnership, async (req, res) => {
  try {
    res.json({
      chatbotId: req.chatbot._id,
      faqs: req.chatbot.faqs
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching FAQs', error: error.message });
  }
});

// DELETE FAQ - Delete specific Q&A
router.delete('/:id/faq/:faqId', authMiddleware, requireRole('admin', 'superadmin', 'hr'), checkChatbotOwnership, async (req, res) => {
  try {
    req.chatbot.faqs = req.chatbot.faqs.filter(faq => faq._id.toString() !== req.params.faqId);
    await req.chatbot.save();

    res.json({
      message: 'FAQ deleted successfully',
      faqs: req.chatbot.faqs
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting FAQ', error: error.message });
  }
});

// UPDATE FAQ - Update specific Q&A
router.put('/:id/faq/:faqId', authMiddleware, requireRole('admin', 'superadmin', 'hr'), checkChatbotOwnership, async (req, res) => {
  try {
    const { question, answer } = req.body;

    const faqIndex = req.chatbot.faqs.findIndex(faq => faq._id.toString() === req.params.faqId);
    if (faqIndex === -1) {
      return res.status(404).json({ message: 'FAQ not found' });
    }

    if (question) req.chatbot.faqs[faqIndex].question = question;
    if (answer) req.chatbot.faqs[faqIndex].answer = answer;

    await req.chatbot.save();

    res.json({
      message: 'FAQ updated successfully',
      faqs: req.chatbot.faqs
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating FAQ', error: error.message });
  }
});

module.exports = router;

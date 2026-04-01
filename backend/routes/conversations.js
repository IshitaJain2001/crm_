const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Chatbot = require('../models/Chatbot');
const { authMiddleware, requireRole, adminOnly } = require('../middleware/roleAuth');

// Middleware to validate chatbot access
const checkChatbotAccess = async (req, res, next) => {
  try {
    const chatbot = await Chatbot.findById(req.params.chatbotId);
    if (!chatbot) {
      return res.status(404).json({ message: 'Chatbot not found' });
    }
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

// CREATE - Start a new conversation (public endpoint)
router.post('/start', async (req, res) => {
  try {
    const { chatbotId, visitorId, visitorName, visitorEmail, metadata } = req.body;

    if (!chatbotId || !visitorId) {
      return res.status(400).json({ message: 'Chatbot ID and Visitor ID required' });
    }

    const chatbot = await Chatbot.findById(chatbotId);
    if (!chatbot || chatbot.status !== 'active') {
      return res.status(404).json({ message: 'Chatbot not available' });
    }

    // Check for existing active conversation
    let conversation = await Conversation.findOne({
      chatbotId,
      visitorId,
      status: 'active'
    });

    if (!conversation) {
      conversation = new Conversation({
        chatbotId,
        workspaceId: chatbot.workspaceId,
        visitorId,
        visitorName,
        visitorEmail,
        source: metadata?.source || 'website',
        sourceUrl: metadata?.sourceUrl,
        visitorUserAgent: metadata?.userAgent,
        visitorIpAddress: metadata?.ipAddress
      });

      await conversation.save();
    }

    res.status(201).json({
      conversationId: conversation._id,
      welcomeMessage: chatbot.welcomeMessage,
      initialPrompt: chatbot.initialPrompt
    });
  } catch (error) {
    res.status(500).json({ message: 'Error starting conversation', error: error.message });
  }
});

// READ - Get conversations for chatbot
router.get('/chatbot/:chatbotId', authMiddleware, checkChatbotAccess, async (req, res) => {
  try {
    const { status, assignedAgent, limit = 20, offset = 0 } = req.query;
    const filter = { chatbotId: req.params.chatbotId };

    if (status) filter.status = status;
    if (assignedAgent) filter.assignedAgent = assignedAgent;

    const conversations = await Conversation.find(filter)
      .populate('assignedAgent', 'name email')
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ 'timing.lastActivityTime': -1 });

    const total = await Conversation.countDocuments(filter);

    res.json({
      conversations,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching conversations', error: error.message });
  }
});

// READ - Get single conversation
router.get('/:conversationId', authMiddleware, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId)
      .populate('chatbotId', 'name workspaceId')
      .populate('assignedAgent', 'name email');

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check workspace access
    if (conversation.chatbotId.workspaceId !== req.user.workspaceId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching conversation', error: error.message });
  }
});

// UPDATE - Update conversation
router.put('/:conversationId', authMiddleware, async (req, res) => {
  try {
    const { status, category, tags, priority, customFields, internalNotes, visitorName, visitorEmail } = req.body;

    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check workspace access
    const chatbot = await Chatbot.findById(conversation.chatbotId);
    if (chatbot.workspaceId !== req.user.workspaceId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Update allowed fields
    if (status) conversation.status = status;
    if (category) conversation.category = category;
    if (tags) conversation.tags = tags;
    if (priority) conversation.priority = priority;
    if (customFields) conversation.customFields = customFields;
    if (internalNotes !== undefined) conversation.internalNotes = internalNotes;
    if (visitorName) conversation.visitorName = visitorName;
    if (visitorEmail) conversation.visitorEmail = visitorEmail;

    if (status === 'closed' && !conversation.timing.endTime) {
      conversation.timing.endTime = new Date();
      conversation.sessionDuration = Math.floor(
        (conversation.timing.endTime - conversation.timing.startTime) / 1000
      );
    }

    await conversation.save();

    res.json({
      message: 'Conversation updated',
      conversation
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating conversation', error: error.message });
  }
});

// ASSIGN - Assign conversation to agent
router.post('/:conversationId/assign', authMiddleware, requireRole('admin', 'superadmin', 'hr'), async (req, res) => {
  try {
    const { agentId } = req.body;

    const conversation = await Conversation.findByIdAndUpdate(
      req.params.conversationId,
      {
        assignedAgent: agentId,
        status: 'active'
      },
      { new: true }
    ).populate('assignedAgent', 'name email');

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.json({
      message: 'Conversation assigned',
      conversation
    });
  } catch (error) {
    res.status(500).json({ message: 'Error assigning conversation', error: error.message });
  }
});

// ESCALATE - Escalate to agent
router.post('/:conversationId/escalate', async (req, res) => {
  try {
    const { reason, escalatedFrom } = req.body;

    const conversation = await Conversation.findByIdAndUpdate(
      req.params.conversationId,
      {
        status: 'escalated',
        'escalation.isEscalated': true,
        'escalation.escalatedAt': new Date(),
        'escalation.escalationReason': reason,
        'escalation.escalatedFrom': escalatedFrom
      },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.json({
      message: 'Conversation escalated',
      conversation
    });
  } catch (error) {
    res.status(500).json({ message: 'Error escalating conversation', error: error.message });
  }
});

// CLOSE - Close conversation
router.post('/:conversationId/close', authMiddleware, async (req, res) => {
  try {
    const { satisfactionRating, satisfactionFeedback, resolutionType, resolutionNotes } = req.body;

    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    conversation.status = 'closed';
    conversation.timing.endTime = new Date();
    conversation.sessionDuration = Math.floor(
      (conversation.timing.endTime - conversation.timing.startTime) / 1000
    );

    if (satisfactionRating) conversation.satisfactionRating = satisfactionRating;
    if (satisfactionFeedback) conversation.satisfactionFeedback = satisfactionFeedback;
    if (resolutionType) conversation.resolutionType = resolutionType;

    if (resolutionNotes) {
      conversation.resolutionDetails = {
        resolvedAt: new Date(),
        resolvedBy: req.user.id,
        notes: resolutionNotes
      };
    }

    await conversation.save();

    res.json({
      message: 'Conversation closed',
      conversation
    });
  } catch (error) {
    res.status(500).json({ message: 'Error closing conversation', error: error.message });
  }
});

// ANALYTICS - Get conversation statistics
router.get('/chatbot/:chatbotId/stats', authMiddleware, checkChatbotAccess, async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const filter = { chatbotId: req.params.chatbotId };

    if (dateFrom || dateTo) {
      filter['timing.startTime'] = {};
      if (dateFrom) filter['timing.startTime'].$gte = new Date(dateFrom);
      if (dateTo) filter['timing.startTime'].$lte = new Date(dateTo);
    }

    const total = await Conversation.countDocuments(filter);
    const active = await Conversation.countDocuments({ ...filter, status: 'active' });
    const closed = await Conversation.countDocuments({ ...filter, status: 'closed' });
    const escalated = await Conversation.countDocuments({ ...filter, 'escalation.isEscalated': true });

    const avgRating = await Conversation.aggregate([
      { $match: { ...filter, satisfactionRating: { $ne: null } } },
      { $group: { _id: null, avgRating: { $avg: '$satisfactionRating' } } }
    ]);

    res.json({
      stats: {
        total,
        active,
        closed,
        escalated,
        averageSatisfaction: avgRating[0]?.avgRating || 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

module.exports = router;

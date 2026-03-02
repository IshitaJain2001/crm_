const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Chatbot = require('../models/Chatbot');
const { authMiddleware } = require('../middleware/roleAuth');

// CREATE - Add message to conversation (can be public for visitor messages)
router.post('/', async (req, res) => {
  try {
    const { conversationId, sender, content, attachments, metadata, isAutomated } = req.body;

    if (!conversationId || !sender || !content) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // For agent messages, auth is required (checked elsewhere)

    // Create message object
    const message = {
      sender,
      content,
      isAutomated: isAutomated || (sender === 'bot'),
      timestamp: new Date()
    };

    if (attachments) message.attachments = attachments;
    if (metadata) message.metadata = metadata;

    // Add message to conversation
    conversation.messages.push(message);

    // Update metrics
    if (conversation.messages.length === 1) {
      conversation.timing.responseTime = 0; // First message is instant
    } else if (sender === 'bot' && conversation.messages.length > 1) {
      // Calculate response time from last visitor message
      const lastVisitorMsg = [...conversation.messages].reverse()
        .find(m => m.sender === 'visitor' && m !== message);
      
      if (lastVisitorMsg) {
        conversation.timing.responseTime = new Date() - lastVisitorMsg.timestamp;
      }
    }

    conversation.timing.lastActivityTime = new Date();
    conversation.messageCount = conversation.messages.length;

    await conversation.save();

    res.status(201).json({
      message: 'Message added',
      messageId: conversation.messages[conversation.messages.length - 1]._id
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding message', error: error.message });
  }
});

// READ - Get messages for conversation
router.get('/conversation/:conversationId', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Get messages with pagination
    const messages = conversation.messages
      .slice(-parseInt(offset) - parseInt(limit), -parseInt(offset) || undefined)
      .reverse();

    res.json({
      conversationId: conversation._id,
      messages,
      pagination: {
        total: conversation.messages.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
});

// UPDATE - Edit message (admin only)
router.put('/:conversationId/:messageId', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;

    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check workspace access
    const chatbot = await Chatbot.findById(conversation.chatbotId);
    if (chatbot.workspaceId !== req.user.workspaceId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const message = conversation.messages.id(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (content) message.content = content;
    
    conversation.updatedAt = new Date();
    await conversation.save();

    res.json({
      message: 'Message updated',
      messageId: message._id
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating message', error: error.message });
  }
});

// DELETE - Delete message (admin only)
router.delete('/:conversationId/:messageId', authMiddleware, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check workspace access
    const chatbot = await Chatbot.findById(conversation.chatbotId);
    if (chatbot.workspaceId !== req.user.workspaceId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const message = conversation.messages.id(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    message.deleteOne();
    conversation.messageCount = conversation.messages.length;
    conversation.updatedAt = new Date();
    
    await conversation.save();

    res.json({
      message: 'Message deleted',
      messageId: req.params.messageId
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting message', error: error.message });
  }
});

// SEARCH - Search messages in conversation
router.get('/search/:conversationId', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query required' });
    }

    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const searchRegex = new RegExp(query, 'i');
    const results = conversation.messages.filter(msg => 
      searchRegex.test(msg.content)
    );

    res.json({
      conversationId: conversation._id,
      query,
      results,
      count: results.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error searching messages', error: error.message });
  }
});

// SENTIMENT - Analyze sentiment of messages
router.post('/sentiment/:conversationId', authMiddleware, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Simple sentiment analysis based on keywords
    let totalScore = 0;
    const positiveWords = ['good', 'great', 'excellent', 'thanks', 'happy', 'satisfied', 'love'];
    const negativeWords = ['bad', 'poor', 'terrible', 'angry', 'frustrated', 'disappointed', 'hate'];

    conversation.messages.forEach(msg => {
      if (msg.sender === 'visitor') {
        const content = msg.content.toLowerCase();
        const posCount = positiveWords.filter(w => content.includes(w)).length;
        const negCount = negativeWords.filter(w => content.includes(w)).length;
        
        if (posCount > 0 || negCount > 0) {
          totalScore += (posCount - negCount) / (posCount + negCount);
        }
      }
    });

    const avgSentiment = conversation.messages.length > 0 
      ? totalScore / conversation.messages.length 
      : 0;

    conversation.sentiment.currentScore = Math.max(-1, Math.min(1, avgSentiment));
    await conversation.save();

    res.json({
      conversationId: conversation._id,
      sentimentScore: conversation.sentiment.currentScore,
      interpretation: 
        conversation.sentiment.currentScore > 0.3 ? 'positive' :
        conversation.sentiment.currentScore < -0.3 ? 'negative' :
        'neutral'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error analyzing sentiment', error: error.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const KnowledgeBase = require('../models/KnowledgeBase');
const Chatbot = require('../models/Chatbot');
const { authMiddleware, requireRole, adminOnly } = require('../middleware/roleAuth');

// Middleware to check chatbot ownership
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

// CREATE - Create KB article
router.post('/:chatbotId/articles', authMiddleware, checkChatbotAccess, async (req, res) => {
  try {
    const { title, content, category, tags, keywords, intents, status } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({ message: 'Title, content, and category required' });
    }

    const article = new KnowledgeBase({
      chatbotId: req.params.chatbotId,
      workspaceId: req.user.workspaceId,
      title,
      content,
      category,
      tags: tags || [],
      keywords: keywords || [],
      intents: intents || [],
      status: status || 'draft',
      author: req.user.id,
      isPublished: status === 'published'
    });

    if (status === 'published') {
      article.publishedAt = new Date();
    }

    await article.save();

    res.status(201).json({
      message: 'Knowledge base article created',
      article
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating article', error: error.message });
  }
});

// READ - Get all articles for chatbot
router.get('/:chatbotId/articles', authMiddleware, checkChatbotAccess, async (req, res) => {
  try {
    const { category, status, limit = 20, offset = 0 } = req.query;
    const filter = { chatbotId: req.params.chatbotId };

    if (category) filter.category = category;
    if (status) filter.status = status;

    const articles = await KnowledgeBase.find(filter)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ priority: -1, createdAt: -1 });

    const total = await KnowledgeBase.countDocuments(filter);
    const categories = await KnowledgeBase.distinct('category', { chatbotId: req.params.chatbotId });

    res.json({
      articles,
      categories,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching articles', error: error.message });
  }
});

// READ - Get single article
router.get('/:chatbotId/articles/:articleId', authMiddleware, checkChatbotAccess, async (req, res) => {
  try {
    const article = await KnowledgeBase.findOne({
      _id: req.params.articleId,
      chatbotId: req.params.chatbotId
    }).populate('author', 'name email');

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Increment view count
    article.analytics.viewCount += 1;
    article.analytics.lastViewedAt = new Date();
    await article.save();

    res.json(article);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching article', error: error.message });
  }
});

// UPDATE - Update article
router.put('/:chatbotId/articles/:articleId', authMiddleware, checkChatbotAccess, async (req, res) => {
  try {
    const { title, content, category, tags, keywords, intents, status, priority } = req.body;

    const article = await KnowledgeBase.findOne({
      _id: req.params.articleId,
      chatbotId: req.params.chatbotId
    });

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Update fields
    if (title !== undefined) article.title = title;
    if (content !== undefined) article.content = content;
    if (category !== undefined) article.category = category;
    if (tags !== undefined) article.tags = tags;
    if (keywords !== undefined) article.keywords = keywords;
    if (intents !== undefined) article.intents = intents;
    if (priority !== undefined) article.priority = priority;

    if (status !== undefined) {
      article.status = status;
      if (status === 'published' && !article.publishedAt) {
        article.publishedAt = new Date();
        article.isPublished = true;
      }
    }

    article.lastModifiedBy = req.user.id;
    await article.save();

    res.json({
      message: 'Article updated',
      article
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating article', error: error.message });
  }
});

// DELETE - Delete article
router.delete('/:chatbotId/articles/:articleId', authMiddleware, checkChatbotAccess, async (req, res) => {
  try {
    const result = await KnowledgeBase.deleteOne({
      _id: req.params.articleId,
      chatbotId: req.params.chatbotId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Article not found' });
    }

    res.json({ message: 'Article deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting article', error: error.message });
  }
});

// SEARCH - Search KB articles
router.get('/:chatbotId/search', async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query required' });
    }

    const searchRegex = new RegExp(query, 'i');

    const results = await KnowledgeBase.find({
      chatbotId: req.params.chatbotId,
      status: 'published',
      $or: [
        { title: searchRegex },
        { content: searchRegex },
        { keywords: searchRegex },
        { tags: searchRegex }
      ]
    })
    .limit(parseInt(limit))
    .select('title slug category keywords intents analytics.usageCount')
    .sort({ priority: -1, 'analytics.usageCount': -1 });

    res.json({
      query,
      results,
      count: results.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error searching articles', error: error.message });
  }
});

// MATCH - Find KB article by intent/keywords (for chatbot)
router.post('/:chatbotId/match', async (req, res) => {
  try {
    const { query, intents } = req.body;

    if (!query && (!intents || intents.length === 0)) {
      return res.status(400).json({ message: 'Query or intents required' });
    }

    const searchRegex = query ? new RegExp(query, 'i') : null;

    let filter = {
      chatbotId: req.params.chatbotId,
      status: 'published'
    };

    if (intents && intents.length > 0) {
      filter['intents.intent'] = { $in: intents };
    }

    let results;
    if (searchRegex) {
      results = await KnowledgeBase.find({
        ...filter,
        $or: [
          { title: searchRegex },
          { content: searchRegex },
          { keywords: searchRegex }
        ]
      }).limit(3);
    } else {
      results = await KnowledgeBase.find(filter).limit(3);
    }

    // Update usage count
    if (results.length > 0) {
      results[0].analytics.usageCount += 1;
      results[0].analytics.lastUsedAt = new Date();
      await results[0].save();
    }

    res.json({
      matches: results,
      bestMatch: results[0] || null
    });
  } catch (error) {
    res.status(500).json({ message: 'Error matching article', error: error.message });
  }
});

// RATE - User rates article helpfulness
router.post('/:chatbotId/articles/:articleId/rate', async (req, res) => {
  try {
    const { helpful } = req.body;

    const article = await KnowledgeBase.findOne({
      _id: req.params.articleId,
      chatbotId: req.params.chatbotId
    });

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    if (helpful) {
      article.analytics.helpfulCount += 1;
    } else {
      article.analytics.unhelpfulCount += 1;
    }

    await article.save();

    res.json({
      message: 'Rating recorded',
      helpfulCount: article.analytics.helpfulCount,
      unhelpfulCount: article.analytics.unhelpfulCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Error rating article', error: error.message });
  }
});

// ANALYTICS - Get KB analytics
router.get('/:chatbotId/analytics', authMiddleware, checkChatbotAccess, async (req, res) => {
  try {
    const articles = await KnowledgeBase.find({ chatbotId: req.params.chatbotId });

    const stats = {
      totalArticles: articles.length,
      publishedArticles: articles.filter(a => a.status === 'published').length,
      totalViews: articles.reduce((sum, a) => sum + a.analytics.viewCount, 0),
      totalUsage: articles.reduce((sum, a) => sum + a.analytics.usageCount, 0),
      totalHelpful: articles.reduce((sum, a) => sum + a.analytics.helpfulCount, 0),
      averageHelpfulness: articles.length > 0
        ? articles.reduce((sum, a) => sum + a.analytics.helpfulCount, 0) / articles.length
        : 0,
      topArticles: articles
        .sort((a, b) => b.analytics.usageCount - a.analytics.usageCount)
        .slice(0, 5)
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
});

module.exports = router;

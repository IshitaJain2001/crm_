const mongoose = require('mongoose');

const KnowledgeBaseSchema = new mongoose.Schema({
  // Basic Information
  chatbotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chatbot',
    required: true,
    index: true
  },
  workspaceId: {
    type: String,
    required: true,
    index: true
  },

  // Content
  title: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    lowercase: true,
    trim: true,
    index: true
  },
  description: {
    type: String
  },
  content: {
    type: String,
    required: true
  },

  // Rich Content Support
  contentType: {
    type: String,
    enum: ['text', 'html', 'markdown'],
    default: 'text'
  },
  htmlContent: {
    type: String
  },

  // Organization
  category: {
    type: String,
    required: true,
    index: true
  },
  subcategory: {
    type: String
  },
  tags: [{
    type: String,
    lowercase: true
  }],

  // SEO & Discovery
  keywords: [{
    type: String,
    lowercase: true
  }],
  relatedArticles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KnowledgeBase'
  }],

  // Intent Matching (for NLP/chatbot)
  intents: [{
    intent: String, // e.g., "billing_inquiry", "technical_support"
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.8
    }
  }],
  triggers: [{
    type: String // Keywords that trigger this article
  }],

  // Visibility & Status
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  },
  visibility: {
    type: String,
    enum: ['public', 'internal', 'draft'],
    default: 'public'
  },

  // Ranking & Priority
  priority: {
    type: Number,
    default: 0
  },
  displayOrder: {
    type: Number,
    default: 0
  },

  // Analytics
  analytics: {
    viewCount: {
      type: Number,
      default: 0
    },
    usageCount: {
      type: Number,
      default: 0 // Times suggested by bot
    },
    helpfulCount: {
      type: Number,
      default: 0 // User ratings
    },
    unhelpfulCount: {
      type: Number,
      default: 0
    },
    lastViewedAt: Date,
    lastUsedAt: Date
  },

  // Engagement Metrics
  engagement: {
    clickThroughRate: {
      type: Number,
      default: 0
    },
    averageTimeOnPage: {
      type: Number,
      default: 0 // seconds
    },
    conversionCount: {
      type: Number,
      default: 0
    }
  },

  // Response Template
  isResponseTemplate: {
    type: Boolean,
    default: false
  },
  responseTemplate: {
    botIntro: String, // How bot introduces this article
    botOutro: String, // How bot closes after sharing
    agentTemplate: String // Template for agent responses
  },

  // Attachments & Media
  attachments: [{
    filename: String,
    url: String,
    type: String,
    size: Number
  }],
  featuredImage: {
    url: String,
    alt: String
  },

  // Links & External Resources
  externalLinks: [{
    title: String,
    url: String,
    description: String
  }],

  // Metadata
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Localization
  language: {
    type: String,
    default: 'en'
  },
  translations: [{
    language: String,
    title: String,
    content: String
  }],

  // Custom Metadata
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate slug from title
KnowledgeBaseSchema.pre('save', function(next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
  this.updatedAt = new Date();
  next();
});

// Indexes
KnowledgeBaseSchema.index({ chatbotId: 1, status: 1 });
KnowledgeBaseSchema.index({ chatbotId: 1, category: 1 });
KnowledgeBaseSchema.index({ workspaceId: 1, isPublished: 1 });
KnowledgeBaseSchema.index({ tags: 1 });
KnowledgeBaseSchema.index({ keywords: 1 });
KnowledgeBaseSchema.index({ 'intents.intent': 1 });
KnowledgeBaseSchema.index({ createdAt: -1 });

module.exports = mongoose.model('KnowledgeBase', KnowledgeBaseSchema);

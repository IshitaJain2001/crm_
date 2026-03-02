const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId()
  },
  sender: {
    type: String,
    enum: ['bot', 'visitor', 'agent'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  attachments: [{
    filename: String,
    url: String,
    mimeType: String,
    size: Number
  }],
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },
  isAutomated: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const ConversationSchema = new mongoose.Schema({
  // References
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
  visitorId: {
    type: String,
    required: true,
    index: true
  },

  // Visitor Information
  visitorEmail: {
    type: String,
    lowercase: true
  },
  visitorName: {
    type: String
  },
  visitorPhone: {
    type: String
  },
  visitorCompany: {
    type: String
  },
  visitorLocation: {
    country: String,
    city: String,
    region: String
  },
  visitorUserAgent: {
    type: String
  },
  visitorIpAddress: {
    type: String
  },

  // Conversation Status
  status: {
    type: String,
    enum: ['active', 'closed', 'escalated', 'pending'],
    default: 'active',
    index: true
  },
  assignedAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Messages
  messages: [MessageSchema],

  // Message Counter for optimization
  messageCount: {
    type: Number,
    default: 0
  },

  // Interaction Metrics
  timing: {
    startTime: {
      type: Date,
      default: Date.now
    },
    endTime: {
      type: Date
    },
    lastActivityTime: {
      type: Date,
      default: Date.now
    },
    responseTime: {
      type: Number, // milliseconds for first response
      default: null
    },
    idleDuration: {
      type: Number, // milliseconds idle time
      default: 0
    }
  },

  // Sentiment & Satisfaction
  sentiment: {
    currentScore: {
      type: Number,
      min: -1,
      max: 1,
      default: 0 // -1: negative, 0: neutral, 1: positive
    },
    trend: {
      type: String,
      enum: ['improving', 'stable', 'declining'],
      default: 'stable'
    }
  },
  satisfactionRating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  satisfactionFeedback: {
    type: String
  },

  // Classification
  category: {
    type: String,
    default: 'general'
  },
  tags: [{
    type: String
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  // Resolution
  resolutionType: {
    type: String,
    enum: ['self-service', 'bot-resolved', 'agent-resolved', 'unresolved'],
    default: null
  },
  resolutionDetails: {
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    kbArticleUsed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KnowledgeBase'
    },
    notes: String
  },

  // Escalation Details
  escalation: {
    isEscalated: {
      type: Boolean,
      default: false
    },
    escalatedAt: Date,
    escalationReason: String,
    escalatedFrom: String // 'bot' or 'visitor'
  },

  // Context & Custom Fields
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },

  // Integration References
  linkedContact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact'
  },
  linkedCompany: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  linkedActivity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity'
  },

  // Session Information
  sessionDuration: {
    type: Number, // Total duration in seconds
    default: 0
  },
  pageVisits: [{
    url: String,
    timestamp: Date,
    referrer: String
  }],

  // Source Information
  source: {
    type: String,
    enum: ['website', 'mobile', 'api', 'embedded'],
    default: 'website'
  },
  sourceUrl: String,

  // Metadata
  isArchived: {
    type: Boolean,
    default: false
  },
  internalNotes: {
    type: String
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for common queries
ConversationSchema.index({ chatbotId: 1, status: 1 });
ConversationSchema.index({ chatbotId: 1, createdAt: -1 });
ConversationSchema.index({ workspaceId: 1, status: 1 });
ConversationSchema.index({ visitorId: 1, chatbotId: 1 });
ConversationSchema.index({ assignedAgent: 1, status: 1 });
ConversationSchema.index({ 'escalation.isEscalated': 1 });
ConversationSchema.index({ 'timing.startTime': 1 });

// Update timestamp and metadata
ConversationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (this.messages && this.messages.length > 0) {
    this.messageCount = this.messages.length;
    this.timing.lastActivityTime = new Date();
  }
  next();
});

module.exports = mongoose.model('Conversation', ConversationSchema);

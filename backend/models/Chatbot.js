const mongoose = require('mongoose');

const ChatbotSchema = new mongoose.Schema({
  // Basic Info
  workspaceId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'paused'],
    default: 'inactive'
  },

  // Configuration
  language: {
    type: String,
    default: 'en'
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  responseDelay: {
    type: Number,
    default: 0 // milliseconds
  },

  // Widget Appearance
  widget: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    headerColor: {
      type: String,
      default: '#3B82F6' // Tailwind blue-500
    },
    headerText: {
      type: String,
      default: 'Chat with us'
    },
    messageInputPlaceholder: {
      type: String,
      default: 'Type your message...'
    },
    position: {
      type: String,
      enum: ['bottom-right', 'bottom-left', 'top-right', 'top-left'],
      default: 'bottom-right'
    },
    size: {
      type: String,
      enum: ['small', 'medium', 'large'],
      default: 'medium'
    },
    showOnMobile: {
      type: Boolean,
      default: true
    },
    offlineMessage: {
      type: String,
      default: 'We are offline. Please leave a message.'
    }
  },

  // Behavior Settings
  autoRespond: {
    type: Boolean,
    default: true
  },
  escalationEnabled: {
    type: Boolean,
    default: true
  },
  escalationThreshold: {
    type: Number,
    default: 3 // Number of unresolved exchanges before escalation
  },
  handoffMessage: {
    type: String,
    default: 'Let me connect you with an agent...'
  },
  businessHours: {
    enabled: {
      type: Boolean,
      default: false
    },
    timezone: String,
    schedule: [{
      day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      },
      startTime: String, // HH:MM
      endTime: String    // HH:MM
    }]
  },

  // Integration & API
  apiKey: {
    type: String,
    unique: true,
    sparse: true
  },
  webhookUrl: {
    type: String
  },
  webhookSecret: {
    type: String
  },

  // Knowledge Base Settings
  knowledgeBase: {
    enabled: {
      type: Boolean,
      default: true
    },
    autoMatch: {
      type: Boolean,
      default: true
    },
    matchThreshold: {
      type: Number,
      default: 0.6 // Confidence threshold (0-1)
    }
  },

  // NLP Settings (for future AI integration)
  nlp: {
    enabled: {
      type: Boolean,
      default: false
    },
    provider: {
      type: String,
      enum: ['builtin', 'openai', 'claude', 'google'],
      default: 'builtin'
    },
    modelVersion: String
  },

  // Analytics
  analytics: {
    totalConversations: {
      type: Number,
      default: 0
    },
    totalMessages: {
      type: Number,
      default: 0
    },
    averageResponseTime: {
      type: Number,
      default: 0 // milliseconds
    },
    averageSatisfactionScore: {
      type: Number,
      default: 0 // 0-5
    },
    escalationRate: {
      type: Number,
      default: 0 // percentage
    },
    resolutionRate: {
      type: Number,
      default: 0 // percentage
    }
  },

  // Welcome & Initial Messages
  welcomeMessage: {
    type: String,
    default: 'Hello! How can I help you today?'
  },
  initialPrompt: {
    type: String,
    default: 'Please tell us what you need.'
  },

  // Q&A Pairs for FAQ
  faqs: [{
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId()
    },
    question: {
      type: String,
      required: true
    },
    answer: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Default Agent Assignment (optional)
  defaultAssignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Features
  features: {
    emailCollection: {
      type: Boolean,
      default: true
    },
    phoneCollection: {
      type: Boolean,
      default: false
    },
    nameCollection: {
      type: Boolean,
      default: true
    },
    fileUpload: {
      type: Boolean,
      default: false
    },
    ratingSystem: {
      type: Boolean,
      default: true
    }
  },

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Indexes
ChatbotSchema.index({ workspaceId: 1, status: 1 });
ChatbotSchema.index({ workspaceId: 1, createdAt: -1 });
ChatbotSchema.index({ apiKey: 1 });

// Update timestamp on save
ChatbotSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Chatbot', ChatbotSchema);

const mongoose = require('mongoose');

const calendarIntegrationSchema = new mongoose.Schema({
  // User & Company
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  // Provider
  provider: {
    type: String,
    enum: ['google', 'outlook', 'ical'],
    required: true
  },

  // Authentication
  accessToken: String,
  refreshToken: String,
  tokenExpiresAt: Date,

  // Calendar Details
  calendarId: String,
  calendarName: String,
  calendarEmail: String,
  timezone: String,

  // Permissions
  permissions: [String], // 'read', 'write', 'sync'

  // Sync Settings
  syncEnabled: {
    type: Boolean,
    default: true
  },

  lastSyncedAt: Date,
  syncDirection: {
    type: String,
    enum: ['one-way', 'two-way'],
    default: 'two-way'
  },

  // Configuration
  workingHours: {
    startTime: String, // HH:MM format
    endTime: String,
    daysOfWeek: [Number] // 0-6 (Sunday-Saturday)
  },

  bufferTime: Number, // Minutes between meetings

  // Preferences
  includeAttendeeAvailability: {
    type: Boolean,
    default: true
  },

  autoConfirmMeetings: {
    type: Boolean,
    default: false
  },

  // Status
  status: {
    type: String,
    enum: ['connected', 'disconnected', 'error'],
    default: 'disconnected'
  },

  errorMessage: String,

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Indexes
calendarIntegrationSchema.index({ user: 1, provider: 1 });
calendarIntegrationSchema.index({ company: 1, syncEnabled: 1 });

module.exports = mongoose.model('CalendarIntegration', calendarIntegrationSchema);

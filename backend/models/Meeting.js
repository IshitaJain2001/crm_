const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  // Participants
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  attendees: [{
    email: String,
    name: String,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'tentative'],
      default: 'pending'
    },
    contactId: mongoose.Schema.Types.ObjectId
  }],

  // Meeting Details
  title: {
    type: String,
    required: true
  },

  description: String,

  startTime: {
    type: Date,
    required: true
  },

  endTime: {
    type: Date,
    required: true
  },

  // Location & Meeting Type
  location: String,

  meetingType: {
    type: String,
    enum: ['in-person', 'video', 'phone', 'virtual'],
    default: 'video'
  },

  meetingLink: String, // Zoom, Google Meet, Teams link

  // Company & Context
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  contact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact'
  },

  deal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal'
  },

  // Calendar Integration
  calendarEventId: String, // Google Calendar event ID
  calendarProvider: {
    type: String,
    enum: ['google', 'outlook', 'local'],
    default: 'local'
  },

  syncedToCalendar: {
    type: Boolean,
    default: false
  },

  // Meeting Status
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
    default: 'scheduled'
  },

  // Notes & Recording
  notes: String,
  recordingUrl: String,
  recordingId: String,

  // Reminders
  reminders: [{
    time: Number, // Minutes before meeting
    sent: Boolean,
    sentAt: Date
  }],

  // Tags & Categories
  tags: [String],
  category: String,

  // Follow-ups
  followUpDate: Date,
  followUpTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity'
  },

  // Metadata
  duration: Number, // In minutes
  timezone: String,
  isRecurring: Boolean,
  recurrencePattern: String,

  metadata: mongoose.Schema.Types.Mixed,

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
meetingSchema.index({ company: 1, startTime: -1 });
meetingSchema.index({ organizer: 1, status: 1 });
meetingSchema.index({ contact: 1 });
meetingSchema.index({ 'attendees.email': 1 });
meetingSchema.index({ calendarEventId: 1 });

module.exports = mongoose.model('Meeting', meetingSchema);

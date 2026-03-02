const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // Company & User Context
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Notification Details
    type: {
      type: String,
      enum: [
        "contact_created",
        "contact_updated",
        "company_created",
        "company_updated",
        "deal_created",
        "deal_updated",
        "deal_stage_changed",
        "task_created",
        "task_assigned",
        "task_completed",
        "email_sent",
        "email_opened",
        "email_clicked",
        "meeting_created",
        "meeting_scheduled",
        "meeting_completed",
        "meeting_reminder",
        "form_submitted",
        "activity_logged",
        "user_mentioned",
        "item_assigned",
        "comment_added",
        "deadline_approaching",
      ],
      required: true,
    },

    // Related Data
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
    },
    icon: String, // emoji or icon name
    color: {
      type: String,
      default: "blue",
    }, // blue, green, red, yellow, purple

    // Resource Reference
    resourceType: {
      type: String,
      enum: [
        "contact",
        "company",
        "deal",
        "task",
        "email",
        "meeting",
        "form",
        "activity",
        "user",
      ],
    },
    resourceId: mongoose.Schema.Types.ObjectId,

    // Actor (who did the action)
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    actorName: String,
    actorEmail: String,

    // Status
    read: {
      type: Boolean,
      default: false,
    },
    readAt: Date,

    // Action URL
    actionUrl: String,

    // Priority
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    // Dismissal
    dismissed: {
      type: Boolean,
      default: false,
    },
    dismissedAt: Date,

    // Metadata
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

// Indexes for fast queries
notificationSchema.index({ company: 1, userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ userId: 1, dismissed: 1 });
notificationSchema.index({ company: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1 });

module.exports = mongoose.model("Notification", notificationSchema);

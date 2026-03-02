const mongoose = require("mongoose");

const emailTemplateSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: [
        "initial_contact",
        "follow_up",
        "proposal",
        "closing",
        "negotiation",
        "thank_you",
        "re_engagement",
        "win_back",
        "feedback_request",
        "other",
      ],
      default: "other",
    },
    dealStage: {
      type: String,
      enum: ["qualification", "proposal", "negotiation", "decision", "all"],
      default: "all",
    },
    variables: [
      {
        name: String, // e.g., "{{customerName}}", "{{companyName}}"
        description: String,
      },
    ],
    successRate: {
      type: Number,
      default: 0, // percentage - auto-calculated
    },
    timesUsed: {
      type: Number,
      default: 0,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmailTemplate", emailTemplateSchema);

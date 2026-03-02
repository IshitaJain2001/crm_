const mongoose = require("mongoose");

const formSubmissionSchema = new mongoose.Schema(
  {
    // Form Reference
    form: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form",
      required: true,
    },

    // Company & Context
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    // Submission Data
    data: mongoose.Schema.Types.Mixed,

    // Lead/Contact Info
    contact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact",
    },
    email: {
      type: String,
      lowercase: true,
    },
    phone: String,
    name: String,

    // Assignment
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["new", "contacted", "converted", "spam"],
      default: "new",
    },

    // Tracking
    ipAddress: String,
    userAgent: String,
    referer: String,
    source: String,
    utm: {
      source: String,
      medium: String,
      campaign: String,
      content: String,
      term: String,
    },

    // Engagement
    viewCount: {
      type: Number,
      default: 1,
    },
    firstViewedAt: Date,
    lastViewedAt: Date,
    timeToComplete: Number, // in seconds
    completedAt: Date,

    // Notes & Comments
    notes: String,
    tags: [String],

    // Marketing
    leadScore: {
      type: Number,
      default: 0,
    },
    qualified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Indexes
formSubmissionSchema.index({ form: 1, createdAt: -1 });
formSubmissionSchema.index({ company: 1, status: 1 });
formSubmissionSchema.index({ contact: 1 });
formSubmissionSchema.index({ email: 1 });
formSubmissionSchema.index({ assignedTo: 1 });

module.exports = mongoose.model("FormSubmission", formSubmissionSchema);

const mongoose = require("mongoose");

const formSchema = new mongoose.Schema(
  {
    // Form Identity
    title: {
      type: String,
      required: [true, "Form title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      sparse: true,
    },

    // Company & Context
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Form Configuration
    fields: [
      {
        id: String,
        name: {
          type: String,
          required: true,
        },
        label: String,
        type: {
          type: String,
          enum: ["text", "email", "phone", "textarea", "select", "checkbox"],
          default: "text",
        },
        placeholder: String,
        required: Boolean,
        options: [String], // For select fields
        order: Number,
      },
    ],

    // Form Styling
    theme: {
      buttonColor: {
        type: String,
        default: "#3B82F6",
      },
      backgroundColor: {
        type: String,
        default: "#FFFFFF",
      },
      textColor: {
        type: String,
        default: "#1F2937",
      },
    },

    // Form Behavior
    redirectUrl: String,
    successMessage: {
      type: String,
      default: "Thank you for submitting the form!",
    },
    thankyouPage: String,

    // Lead Assignment
    assignTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assignToTeam: Boolean,

    // Form Status
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    published: {
      type: Boolean,
      default: false,
    },
    publishedAt: Date,
    archivedAt: Date,

    // Tracking
    submissionCount: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },

    // Analytics
    conversionRate: Number,
    avgTimeToComplete: Number,

    // Notifications
    notifyEmail: [String],
    notifySlack: String,

    // Embed Settings
    embedCode: String,
    embedDomain: [String],
  },
  { timestamps: true }
);

// Generate slug
formSchema.pre("save", function (next) {
  if (!this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w-]/g, "")
      .replace(/-+/g, "-");
  }
  next();
});

// Indexes
formSchema.index({ company: 1, status: 1 });
formSchema.index({ slug: 1 });
formSchema.index({ createdBy: 1 });
formSchema.index({ publishedAt: -1 });

module.exports = mongoose.model("Form", formSchema);

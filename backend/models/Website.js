const mongoose = require("mongoose");

const websiteSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    logo: String,
    sections: [
      {
        id: String, // unique section id
        type: {
          type: String,
          enum: ["hero", "services", "about", "contact", "features", "testimonials"],
        },
        title: String,
        content: String,
        items: [
          {
            id: String,
            title: String,
            description: String,
            icon: String,
            image: String,
          },
        ],
        backgroundColor: {
          type: String,
          default: "#ffffff",
        },
        textColor: {
          type: String,
          default: "#000000",
        },
        order: Number,
      },
    ],
    colors: {
      primary: {
        type: String,
        default: "#3b82f6",
      },
      secondary: {
        type: String,
        default: "#10b981",
      },
      accent: {
        type: String,
        default: "#f59e0b",
      },
    },
    pages: [
      {
        id: String,
        name: String,
        slug: String,
        content: String,
      },
    ],
    customDomain: String,
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedUrl: String,
    analytics: {
      views: {
        type: Number,
        default: 0,
      },
      visitors: {
        type: Number,
        default: 0,
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Website", websiteSchema);

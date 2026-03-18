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
    sections: mongoose.Schema.Types.Mixed, // Use Mixed type for flexibility
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

// Pre-save hook to validate and fix sections array
websiteSchema.pre('save', function(next) {
  console.log("=== WEBSITE PRE-SAVE HOOK ===");
  console.log("Sections type:", typeof this.sections);
  console.log("Sections value:", JSON.stringify(this.sections).substring(0, 200));
  
  if (!this.sections) {
    console.log("Sections is null/undefined, setting to empty array");
    this.sections = [];
    return next();
  }

  // If sections is a string, parse it
  if (typeof this.sections === 'string') {
    console.warn("Sections is a STRING! Parsing...");
    try {
      this.sections = JSON.parse(this.sections);
    } catch (e) {
      console.error("Failed to parse sections string:", e.message);
      this.sections = [];
      return next();
    }
  }

  // Ensure sections is an array
  if (!Array.isArray(this.sections)) {
    console.warn("Sections is not an array after parse:", typeof this.sections);
    this.sections = Array.isArray(this.sections) ? this.sections : [];
    return next();
  }

  console.log("Sections is valid array with", this.sections.length, "items");
  
  // Fix any stringified sections in the array
  this.sections = this.sections.map((section, index) => {
    if (typeof section === 'string') {
      console.warn(`Section[${index}] is a string, attempting to parse...`);
      try {
        const parsed = JSON.parse(section);
        console.log(`Section[${index}] parsed successfully`);
        if (Array.isArray(parsed)) {
          // If parsing a stringified array, take first element
          console.warn(`Section[${index}] was a stringified array, using first element`);
          return parsed[0] || { type: 'hero', content: 'Empty section' };
        }
        return parsed;
      } catch (e) {
        console.error(`Failed to parse section[${index}]:`, e.message);
        return { type: 'error', content: 'Invalid section' };
      }
    }
    if (typeof section !== 'object' || section === null) {
      console.warn(`Section[${index}] is invalid type:`, typeof section);
      return { type: 'error', content: 'Invalid section' };
    }
    return section;
  });

  console.log("After validation, sections count:", this.sections.length);
  next();
});

module.exports = mongoose.model("Website", websiteSchema);

const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Please provide first name'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Please provide last name'],
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  phone: String,
  mobile: String,
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  jobTitle: String,
  department: String,
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  lifecycle: {
    type: String,
    enum: ['subscriber', 'lead', 'customer', 'evangelist'],
    default: 'subscriber'
  },
  leadStatus: {
    type: String,
    enum: ['new', 'open', 'in_progress', 'open_deal', 'unqualified', 'attempted_contact', 'connected', 'qualified'],
    default: 'new'
  },
  leadScore: {
    type: Number,
    min: 0,
    default: 0
  },
  tags: [String],
  notes: String,
  customFields: mongoose.Schema.Types.Mixed,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for faster searches
contactSchema.index({ email: 1 });
contactSchema.index({ firstName: 1, lastName: 1 });
contactSchema.index({ company: 1 });
contactSchema.index({ owner: 1 });

module.exports = mongoose.model('Contact', contactSchema);

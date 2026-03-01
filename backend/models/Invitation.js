const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  
  role: {
    type: String,
    enum: ['admin', 'hr', 'sales', 'employee'],
    default: 'employee',
    required: true
  },
  
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  invitationToken: {
    type: String,
    required: true,
    unique: true
  },
  
  invitationLink: {
    type: String
    // e.g., https://app.crm.com/join?token=xyz
  },
  
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired'],
    default: 'pending'
  },
  
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  acceptedAt: Date,
  
  expiresAt: {
    type: Date,
    required: true
    // Typically 7 days from creation
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-expire invitations
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
invitationSchema.index({ company: 1, email: 1 });
invitationSchema.index({ invitationToken: 1 });

module.exports = mongoose.model('Invitation', invitationSchema);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  
  // Company this user belongs to
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  
  // Role within the company
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'hr', 'sales', 'employee'],
    default: 'employee'
  },
  
  permissions: [String],
  
  department: {
    type: String,
    enum: ['sales', 'hr', 'support', 'marketing', 'management', 'tech', 'other'],
    default: 'other'
  },
  
  phone: String,
  avatar: String,
  
  // Email verification
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerifiedAt: Date,
  
  active: {
    type: Boolean,
    default: true
  },
  
  // Track if user was created via invitation
  invitationToken: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invitation'
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  lastLogin: Date,
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Unique constraint: email per company
userSchema.index({ email: 1, company: 1 }, { unique: true });
userSchema.index({ company: 1 });
userSchema.index({ company: 1, role: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

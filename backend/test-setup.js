// Test script to verify all dependencies and config
require('dotenv').config();

console.log('\n=== TESTING CRM BACKEND SETUP ===\n');

// 1. Check Node modules
console.log('1️⃣  Checking Node modules...');
try {
  require('express');
  console.log('  ✓ express');
  require('mongoose');
  console.log('  ✓ mongoose');
  require('jsonwebtoken');
  console.log('  ✓ jsonwebtoken');
  require('bcryptjs');
  console.log('  ✓ bcryptjs');
  require('nodemailer');
  console.log('  ✓ nodemailer');
  require('dotenv');
  console.log('  ✓ dotenv');
} catch (err) {
  console.error('  ✗ Missing module:', err.message);
  process.exit(1);
}

// 2. Check environment variables
console.log('\n2️⃣  Checking environment variables...');
const required = ['MONGODB_URI', 'JWT_SECRET', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
let missing = [];

required.forEach(key => {
  if (process.env[key]) {
    console.log(`  ✓ ${key} = ${key === 'JWT_SECRET' || key === 'SMTP_PASS' ? '***' : process.env[key]}`);
  } else {
    console.log(`  ✗ ${key} is missing`);
    missing.push(key);
  }
});

if (missing.length > 0) {
  console.error('\n❌ Missing environment variables:', missing.join(', '));
  console.log('Please add them to .env file\n');
  process.exit(1);
}

// 3. Check models
console.log('\n3️⃣  Checking models...');
try {
  require('./models/User');
  console.log('  ✓ User model');
  require('./models/Company');
  console.log('  ✓ Company model');
  require('./models/EmailVerification');
  console.log('  ✓ EmailVerification model');
  require('./models/Invitation');
  console.log('  ✓ Invitation model');
} catch (err) {
  console.error('  ✗ Model error:', err.message);
  process.exit(1);
}

// 4. Check services
console.log('\n4️⃣  Checking services...');
try {
  require('./services/emailService');
  console.log('  ✓ Email service');
  require('./services/otpService');
  console.log('  ✓ OTP service');
} catch (err) {
  console.error('  ✗ Service error:', err.message);
  process.exit(1);
}

// 5. Check routes
console.log('\n5️⃣  Checking routes...');
try {
  require('./routes/authMultiTenant');
  console.log('  ✓ Auth (Multi-tenant)');
  require('./routes/invitations');
  console.log('  ✓ Invitations');
  require('./routes/admin');
  console.log('  ✓ Admin');
} catch (err) {
  console.error('  ✗ Route error:', err.message);
  process.exit(1);
}

console.log('\n=== ✅ ALL CHECKS PASSED ===\n');
console.log('You can now run: npm run dev\n');

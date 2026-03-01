// Test MongoDB connection
require('dotenv').config();
const mongoose = require('mongoose');

console.log('\n=== TESTING MONGODB CONNECTION ===\n');

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('❌ MONGODB_URI not set in .env\n');
  process.exit(1);
}

console.log('MongoDB URI:', mongoUri.substring(0, 50) + '...');
console.log('Attempting connection...\n');

// Set connection timeout
const connectionTimeout = setTimeout(() => {
  console.error('\n❌ Connection timed out after 30 seconds');
  console.log('\nPossible causes:');
  console.log('1. IP not whitelisted in MongoDB Atlas');
  console.log('2. Wrong username/password');
  console.log('3. Network firewall blocking connection');
  console.log('4. MongoDB URI is incorrect\n');
  process.exit(1);
}, 30000);

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000
})
  .then(() => {
    clearTimeout(connectionTimeout);
    console.log('✅ Connected to MongoDB!\n');
    
    // Test a simple query
    console.log('Testing database access...');
    return mongoose.connection.db.admin().ping();
  })
  .then(() => {
    console.log('✅ Database responsive!\n');
    
    console.log('=== ✅ MONGODB IS WORKING ===\n');
    process.exit(0);
  })
  .catch(err => {
    clearTimeout(connectionTimeout);
    console.error('\n❌ Connection failed:\n');
    console.error('Error:', err.message);
    console.error('\nDEBUG INFO:');
    console.error('- Message:', err.message);
    console.error('- Code:', err.code);
    
    if (err.message.includes('authentication failed')) {
      console.error('\n💡 FIX: Check username/password in MONGODB_URI');
    } else if (err.message.includes('connect ENOTFOUND')) {
      console.error('\n💡 FIX: Wrong cluster URL. Check MongoDB Atlas');
    } else if (err.message.includes('IP address')) {
      console.error('\n💡 FIX: IP not whitelisted. Add your IP in MongoDB Atlas → Network Access');
    }
    
    console.log('\n');
    process.exit(1);
  });

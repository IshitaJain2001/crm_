const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { validateEmailConfig } = require('./middleware/validateEmail');

// Load environment variables
dotenv.config();

// Validate email configuration (required)
validateEmailConfig();

// Initialize Express
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://crm-1-5el5.onrender.com',
  credentials: true
}));

// Increase body size limit for website builder (large JSON payloads)
app.use(express.json({ 
  limit: '50mb',
  // Prevent accidental stringification of nested objects
  strict: true
}));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Debug middleware to log incoming request bodies for website-builder
app.use((req, res, next) => {
  if (req.path.includes('register-company') || req.path.includes('website-builder')) {
    if (req.body && req.body.sections) {
      console.log("DEBUG: Request body sections:", {
        type: typeof req.body.sections,
        isArray: Array.isArray(req.body.sections),
        length: Array.isArray(req.body.sections) ? req.body.sections.length : 'N/A',
        firstElement: Array.isArray(req.body.sections) && req.body.sections.length > 0 
          ? { type: typeof req.body.sections[0], value: JSON.stringify(req.body.sections[0]).substring(0, 100) }
          : 'N/A'
      });
    }
  }
  next();
});

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✓ MongoDB Connected'))
  .catch(err => console.error('✗ MongoDB Connection Error:', err));

// Routes (Multi-tenant auth)
app.use('/api/auth', require('./routes/authMultiTenant'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/invitations', require('./routes/invitations'));
app.use('/api/workspace', require('./routes/workspace'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/oauth', require('./routes/oauth'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/deals', require('./routes/deals'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/users', require('./routes/users'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/emails', require('./routes/emails'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/forms', require('./routes/forms'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/chatbots', require('./routes/chatbots'));
app.use('/api/conversations', require('./routes/conversations'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/knowledge-base', require('./routes/knowledgeBase'));
app.use('/api/industries', require('./routes/industries'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/email-recommendations', require('./routes/emailRecommendations'));
app.use('/api/website-builder', require('./routes/websiteBuilder'));
app.use('/api/automation', require('./routes/automation'));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 CRM Backend running on port ${PORT}`);
  console.log(`📝 API: http://localhost:${PORT}/api`);
  console.log(`💾 Database: ${process.env.MONGODB_URI}\n`);
});

module.exports = app;

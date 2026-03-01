// Validate SMTP configuration on startup
const validateEmailConfig = () => {
  const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('\n❌ EMAIL CONFIGURATION ERROR');
    console.error('The following environment variables are required:\n');
    missing.forEach(key => {
      console.error(`  - ${key}`);
    });
    console.error('\nPlease set these in your .env file and restart the server.\n');
    process.exit(1);
  }

  console.log('✓ Email configuration validated');
};

module.exports = { validateEmailConfig };

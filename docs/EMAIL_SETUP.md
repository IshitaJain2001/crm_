# Email Configuration Guide

Email is now a **required** feature of this CRM. All key actions send notifications via email.

## Required Environment Variables

You MUST set these in `backend/.env`:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=ishitajain385@gmail.com
SMTP_PASS=axpl yvsm ovwe rhgy
```

**The server will not start without these configured.**

## Gmail Setup

### 1. Get App Password (Recommended)

For personal Gmail accounts with 2-Step Verification:

1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Select "Mail" and your device
3. Google generates a 16-character password
4. Copy and paste into `SMTP_PASS`

### 2. Alternative: Regular Gmail Password

If app passwords don't work:

1. Use your regular Gmail password
2. Note: This is less secure, but works for personal projects

## Email Features

### Automatic Emails Sent By CRM

#### 1. **Registration Welcome Email**
- Sent when user creates account
- Contains welcome message and login instructions

#### 2. **Contact Created Notification**
- Sent to user when new contact is added
- Includes contact details (name, email, phone, job title)

#### 3. **Deal Created Notification**
- Sent to deal owner
- Includes deal amount, stage, expected close date

#### 4. **Task Assignment Notification**
- Sent when task is assigned to team member
- Contains task details and due date
- Only sent if task has assignee

#### 5. **Activity Logged Notification**
- Sent when email, call, meeting, or note is logged
- Includes activity type and details

## Testing Email

### Test Locally

1. Install nodemailer:
   ```bash
   cd backend
   npm install
   ```

2. Configure `.env` with Gmail credentials

3. Start server:
   ```bash
   npm run dev
   ```

4. Check console for:
   ```
   ✓ Email service connected successfully
   ✓ Email configuration validated
   ```

5. Register a new account - you should receive welcome email

### Common Issues

#### Email not sending
- Check `.env` has correct credentials
- Verify 2-Step Verification is ON in Google account
- Check server logs for error messages
- Try using app password instead of regular password

#### "Less secure apps" message
- Google blocks "less secure" apps by default
- Use app passwords (recommended)
- Or enable "Less secure app access" in security settings

#### Port 587 blocked
- Some networks block SMTP port
- Try port 465 instead (change `SMTP_PORT=465`)
- Or use alternative email provider

## Using Different Email Provider

### Outlook/Office 365

```
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your_email@outlook.com
SMTP_PASS=your_password
```

### SendGrid

```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxx_your_sendgrid_api_key_xxx
```

### AWS SES

```
SMTP_HOST=email-smtp.region.amazonaws.com
SMTP_PORT=587
SMTP_USER=your_ses_username
SMTP_PASS=your_ses_password
```

## Email Service Architecture

### File: `backend/services/emailService.js`

- **Validates SMTP config** on import
- **Tests connection** on startup
- **Provides functions** for each email type
- **Gracefully handles failures** (email doesn't block operations)

### Functions Available

```javascript
// In your routes, import and use:
const { 
  sendWelcomeEmail,
  sendContactCreatedEmail,
  sendDealCreatedEmail,
  sendTaskAssignedEmail,
  sendActivityNotificationEmail,
  sendPasswordResetEmail
} = require('../services/emailService');

// Send email
await sendWelcomeEmail(user);
```

## Adding Custom Emails

To add new email types:

1. Create new function in `emailService.js`:
   ```javascript
   const sendCustomEmail = async (recipient, data) => {
     const mailOptions = {
       from: process.env.SMTP_USER,
       to: recipient.email,
       subject: 'Your Subject',
       html: `<h1>Your HTML content</h1>`
     };
     await transporter.sendMail(mailOptions);
   };
   ```

2. Export it:
   ```javascript
   module.exports = {
     // ... existing exports
     sendCustomEmail
   };
   ```

3. Use in routes:
   ```javascript
   await sendCustomEmail(user, data);
   ```

## Email Templates

Currently using HTML templates inline. For production, consider:

1. **Handlebars** - Template engine
   ```bash
   npm install handlebars
   ```

2. **Nodemailer-Express-Handlebars** - Integration
   ```bash
   npm install nodemailer-express-handlebars
   ```

3. Create `views/emails/` directory with `.hbs` files

## Monitoring & Logging

### Check Email Logs

Server logs show all email activity:
```
✓ Welcome email sent to ishitajain385@gmail.com
✓ Contact notification sent to user@gmail.com
✗ Error sending email: Connection timeout
```

### Email Delivery Issues

Email failures are logged but don't break operations:
- If email fails, the action still completes
- User sees success message but email might not arrive
- Check server logs to diagnose email issues

## Production Best Practices

1. **Use dedicated email service** (SendGrid, AWS SES, etc.)
   - Better deliverability
   - Better tracking
   - Handles bounces

2. **Add email logging database**
   - Track sent/failed emails
   - Audit trail

3. **Implement retry logic**
   - Retry failed emails
   - Configurable retry count

4. **Use email templates**
   - Consistent branding
   - Easy updates

5. **Monitor email reputation**
   - Track bounce rates
   - Monitor spam complaints

## Troubleshooting

### Server won't start

```
❌ EMAIL CONFIGURATION ERROR
The following environment variables are required:
  - SMTP_HOST
  - SMTP_PORT
  - SMTP_USER
  - SMTP_PASS
```

**Solution**: Set all 4 variables in `.env`

### Gmail authentication failed

```
Error: Invalid login: 535-5.7.8 Username and password not accepted
```

**Solutions**:
1. Use app password instead of regular password
2. Enable 2-Step Verification first
3. Check email/password spelling

### Connection timeout

```
Error: connect ETIMEDOUT smtp.gmail.com:587
```

**Solutions**:
1. Check internet connection
2. Try port 465 instead of 587
3. Try different email provider
4. Check firewall/VPN

### Email not received

- Check spam folder
- Verify recipient email is correct
- Check server logs for send success
- Gmail may delay emails from new senders

## Support

For email issues:
1. Check server logs (terminal output)
2. Verify `.env` configuration
3. Test SMTP connection manually
4. Try with different test email
5. Check email provider documentation

---

Email is critical to CRM functionality. Ensure proper setup before going to production.

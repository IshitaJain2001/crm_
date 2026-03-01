const crypto = require('crypto');
const { transporter } = require('./emailService');
const Email = require('../models/Email');

// Generate unique tracking ID
const generateTrackingId = () => {
  return crypto.randomBytes(16).toString('hex');
};

// Send email with tracking
const sendEmailWithTracking = async (emailData) => {
  try {
    const {
      from,
      to,
      cc,
      bcc,
      subject,
      body,
      company,
      contact,
      deal,
      template
    } = emailData;

    // Generate tracking ID
    const trackingId = generateTrackingId();
    const openPixelId = generateTrackingId();

    // Create email document
    const emailDoc = new Email({
      from,
      fromEmail: emailData.fromEmail,
      to,
      cc,
      bcc,
      subject,
      body,
      company,
      contact,
      deal,
      template,
      trackingId,
      openPixelId,
      status: 'sent'
    });

    // Add tracking pixel to HTML body
    const trackingPixel = `<img src="${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/emails/track/${openPixelId}" width="1" height="1" style="display:none;" />`;
    
    const htmlBody = `${body}${trackingPixel}`;

    // Prepare email options
    const mailOptions = {
      from: emailData.fromEmail || process.env.SMTP_USER,
      to: to.map(t => t.email).join(', '),
      cc: cc ? cc.join(', ') : undefined,
      bcc: bcc ? bcc.join(', ') : undefined,
      subject,
      html: htmlBody,
      headers: {
        'X-Tracking-ID': trackingId,
        'X-Email-ID': emailDoc._id.toString()
      }
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Mark as sent
    emailDoc.status = 'sent';
    emailDoc.sentAt = new Date();
    await emailDoc.save();

    console.log(`✓ Email sent with tracking ID: ${trackingId}`);

    return {
      success: true,
      emailId: emailDoc._id,
      trackingId
    };

  } catch (error) {
    console.error('Error sending email with tracking:', error);
    throw error;
  }
};

// Track email open
const trackEmailOpen = async (openPixelId, request) => {
  try {
    const email = await Email.findOne({ openPixelId });

    if (!email) {
      console.log('Email not found for pixel:', openPixelId);
      return;
    }

    // Check if already recorded (avoid duplicate counts within 10 seconds)
    const recentOpen = email.opens.events.find(
      e => new Date() - new Date(e.timestamp) < 10000
    );

    if (!recentOpen) {
      email.opens.count += 1;
      email.opens.events.push({
        timestamp: new Date(),
        userAgent: request.get('user-agent'),
        ip: request.ip
      });

      await email.save();
      console.log(`✓ Email opened: ${email._id}`);
    }

  } catch (error) {
    console.error('Error tracking email open:', error);
  }
};

// Track email click
const trackEmailClick = async (trackingId, link, request) => {
  try {
    const email = await Email.findOne({ trackingId });

    if (!email) {
      console.log('Email not found for tracking:', trackingId);
      return;
    }

    email.clicks.count += 1;
    email.clicks.events.push({
      timestamp: new Date(),
      link,
      userAgent: request.get('user-agent'),
      ip: request.ip
    });

    await email.save();
    console.log(`✓ Email link clicked: ${email._id}`);

  } catch (error) {
    console.error('Error tracking email click:', error);
  }
};

// Get email analytics
const getEmailAnalytics = async (emailId) => {
  try {
    const email = await Email.findById(emailId).populate('from', 'name email');

    if (!email) {
      return null;
    }

    return {
      emailId: email._id,
      subject: email.subject,
      to: email.to,
      status: email.status,
      sentAt: email.sentAt,
      opens: {
        count: email.opens.count,
        uniqueIPs: [...new Set(email.opens.events.map(e => e.ip))].length,
        events: email.opens.events
      },
      clicks: {
        count: email.clicks.count,
        topLinks: getTopLinks(email.clicks.events),
        events: email.clicks.events
      },
      engagement: {
        openRate: email.to.length > 0 ? ((email.opens.count / email.to.length) * 100).toFixed(2) + '%' : '0%',
        clickRate: email.opens.count > 0 ? ((email.clicks.count / email.opens.count) * 100).toFixed(2) + '%' : '0%'
      }
    };

  } catch (error) {
    console.error('Error getting email analytics:', error);
    throw error;
  }
};

// Get top clicked links
const getTopLinks = (clickEvents) => {
  const links = {};
  clickEvents.forEach(event => {
    links[event.link] = (links[event.link] || 0) + 1;
  });

  return Object.entries(links)
    .map(([link, count]) => ({ link, clicks: count }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);
};

// Get email history
const getEmailHistory = async (userId, company, options = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      contact
    } = options;

    let query = { from: userId, company };

    if (status) query.status = status;
    if (contact) query.contact = contact;

    const emails = await Email.find(query)
      .populate('to.contactId', 'name email')
      .populate('contact', 'name email')
      .populate('deal', 'name')
      .sort({ sentAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Email.countDocuments(query);

    return {
      emails,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

  } catch (error) {
    console.error('Error getting email history:', error);
    throw error;
  }
};

module.exports = {
  sendEmailWithTracking,
  trackEmailOpen,
  trackEmailClick,
  getEmailAnalytics,
  getEmailHistory,
  generateTrackingId
};

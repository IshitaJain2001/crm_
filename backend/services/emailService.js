const nodemailer = require('nodemailer');

// Validate SMTP configuration
if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  throw new Error('SMTP configuration is required. Check your .env file.');
}

// Create email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Test connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('✗ Email service connection failed:', error.message);
  } else {
    console.log('✓ Email service connected successfully');
  }
});

// Send welcome email
const sendWelcomeEmail = async (user) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: user.email,
      subject: 'Welcome to CRM Platform',
      html: `
        <h2>Welcome, ${user.name}!</h2>
        <p>Your account has been successfully created.</p>
        <p>You can now login to access your CRM dashboard.</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p>Start managing your contacts, companies, and deals today!</p>
        <br>
        <p>Best regards,<br>CRM Team</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ Welcome email sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending welcome email:', error.message);
    throw error;
  }
};

// Send contact creation notification
const sendContactCreatedEmail = async (contact, owner) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: owner.email,
      subject: `New Contact Added: ${contact.firstName} ${contact.lastName}`,
      html: `
        <h3>New Contact Created</h3>
        <p><strong>Name:</strong> ${contact.firstName} ${contact.lastName}</p>
        <p><strong>Email:</strong> ${contact.email}</p>
        <p><strong>Phone:</strong> ${contact.phone || 'N/A'}</p>
        <p><strong>Job Title:</strong> ${contact.jobTitle || 'N/A'}</p>
        <br>
        <p>Log in to your CRM to manage this contact.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ Contact notification sent to ${owner.email}`);
  } catch (error) {
    console.error('Error sending contact notification:', error.message);
  }
};

// Send deal creation notification
const sendDealCreatedEmail = async (deal, owner, company) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: owner.email,
      subject: `New Deal Created: ${deal.dealName}`,
      html: `
        <h3>New Deal Created</h3>
        <p><strong>Deal:</strong> ${deal.dealName}</p>
        <p><strong>Company:</strong> ${company?.name || 'N/A'}</p>
        <p><strong>Amount:</strong> $${deal.amount.toLocaleString()}</p>
        <p><strong>Stage:</strong> ${deal.dealStage.replace(/_/g, ' ').toUpperCase()}</p>
        <p><strong>Expected Close:</strong> ${deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : 'N/A'}</p>
        <br>
        <p>Track this deal in your CRM dashboard.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ Deal notification sent to ${owner.email}`);
  } catch (error) {
    console.error('Error sending deal notification:', error.message);
  }
};

// Send task assignment notification
const sendTaskAssignedEmail = async (task, assignedUser, createdBy) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: assignedUser.email,
      subject: `New Task Assigned: ${task.subject}`,
      html: `
        <h3>Task Assigned to You</h3>
        <p><strong>Task:</strong> ${task.subject}</p>
        <p><strong>Description:</strong> ${task.description || 'N/A'}</p>
        <p><strong>Due Date:</strong> ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</p>
        <p><strong>Priority:</strong> ${task.priority.toUpperCase()}</p>
        <p><strong>Assigned by:</strong> ${createdBy.name}</p>
        <br>
        <p>Log in to your CRM to view and complete this task.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ Task assignment sent to ${assignedUser.email}`);
  } catch (error) {
    console.error('Error sending task assignment:', error.message);
  }
};

// Send activity notification
const sendActivityNotificationEmail = async (activity, contact, owner) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: owner.email,
      subject: `Activity Logged: ${activity.subject}`,
      html: `
        <h3>Activity Logged</h3>
        <p><strong>Type:</strong> ${activity.type.toUpperCase()}</p>
        <p><strong>Subject:</strong> ${activity.subject}</p>
        <p><strong>Contact:</strong> ${contact?.firstName} ${contact?.lastName}</p>
        <p><strong>Description:</strong> ${activity.description || 'N/A'}</p>
        <br>
        <p>View more details in your CRM dashboard.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ Activity notification sent to ${owner.email}`);
  } catch (error) {
    console.error('Error sending activity notification:', error.message);
  }
};

// Send password reset email
const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <h3>Password Reset Request</h3>
        <p>You requested to reset your password. Click the link below:</p>
        <p><a href="${resetLink}">Reset Password</a></p>
        <p>Or copy this link:</p>
        <p>${resetLink}</p>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, ignore this email.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ Password reset email sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending password reset email:', error.message);
    throw error;
  }
};

// Send meeting invite email
const sendMeetingInviteEmail = async (attendee, meeting, organizer) => {
  try {
    const calendarLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/meetings/${meeting._id}`;
    const startTime = new Date(meeting.startTime).toLocaleString();
    const endTime = new Date(meeting.endTime).toLocaleString();

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: attendee.email,
      subject: `Meeting Invitation: ${meeting.title}`,
      html: `
        <h2>You're invited to a meeting</h2>
        <p><strong>${organizer.name}</strong> has invited you to a meeting:</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${meeting.title}</h3>
          <p><strong>When:</strong> ${startTime} to ${endTime}</p>
          <p><strong>Duration:</strong> ${meeting.duration} minutes</p>
          ${meeting.location ? `<p><strong>Location:</strong> ${meeting.location}</p>` : ''}
          ${meeting.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${meeting.meetingLink}">${meeting.meetingLink}</a></p>` : ''}
          ${meeting.description ? `<p><strong>Description:</strong> ${meeting.description}</p>` : ''}
        </div>

        <p>
          <a href="${calendarLink}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            View Meeting Details
          </a>
        </p>

        <p>Organizer: ${organizer.name} (${organizer.email})</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ Meeting invite sent to ${attendee.email}`);
  } catch (error) {
    console.error('Error sending meeting invite:', error.message);
    throw error;
  }
};

// Send meeting reminder email
const sendMeetingReminderEmail = async (attendee, meeting, minutesBefore) => {
  try {
    const startTime = new Date(meeting.startTime).toLocaleString();
    
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: attendee.email,
      subject: `Reminder: Meeting in ${minutesBefore} minutes - ${meeting.title}`,
      html: `
        <h3>Meeting Reminder</h3>
        <p>This is a reminder that you have a meeting starting in ${minutesBefore} minutes:</p>
        
        <p><strong>${meeting.title}</strong></p>
        <p><strong>Starts:</strong> ${startTime}</p>
        ${meeting.meetingLink ? `<p><a href="${meeting.meetingLink}">Join Meeting</a></p>` : ''}
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ Meeting reminder sent to ${attendee.email}`);
  } catch (error) {
    console.error('Error sending meeting reminder:', error.message);
  }
};

module.exports = {
  transporter,
  sendWelcomeEmail,
  sendContactCreatedEmail,
  sendDealCreatedEmail,
  sendTaskAssignedEmail,
  sendActivityNotificationEmail,
  sendPasswordResetEmail,
  sendMeetingInviteEmail,
  sendMeetingReminderEmail
};

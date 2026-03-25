const nodemailer = require('nodemailer');

// Validate SMTP configuration
if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  throw new Error('SMTP configuration is required. Check your .env file.');
}

// Create email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
   requireTLS: true,    
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

// Send form submission notification
const sendFormNotificationEmail = async (form, submission) => {
  try {
    const dataRows = Object.entries(submission.data)
      .map(([key, value]) => `<tr><td><strong>${key}:</strong></td><td>${value}</td></tr>`)
      .join("");

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: form.notifyEmail.join(", "),
      subject: `New Form Submission: ${form.title}`,
      html: `
        <h2>New Form Submission</h2>
        <p><strong>Form:</strong> ${form.title}</p>
        <p><strong>Submitted at:</strong> ${new Date(submission.createdAt).toLocaleString()}</p>
        
        <h3>Submission Details:</h3>
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
          ${dataRows}
        </table>
        
        <br>
        <p>
          <a href="${process.env.FRONTEND_URL}/forms/${form._id}/submissions/${submission._id}" style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            View Submission
          </a>
        </p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ Form notification email sent to ${form.notifyEmail.join(", ")}`);
  } catch (error) {
    console.error("Error sending form notification email:", error.message);
    throw error;
  }
};

// Send feedback notification to admin
const sendFeedbackNotificationEmail = async (feedback) => {
  try {
    const ratingStars = "⭐".repeat(feedback.rating);
    
    const categoryLabels = {
      feature_request: "🚀 Feature Request",
      bug_report: "🐛 Bug Report",
      performance: "⚡ Performance",
      ui_ux: "🎨 UI/UX",
      general: "💬 General Feedback"
    };

    const statusLabels = {
      new: "New",
      reviewed: "Reviewed",
      in_progress: "In Progress",
      resolved: "Resolved"
    };

    // Email to admin team
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER;
    
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: adminEmail,
      subject: `New Feedback: ${feedback.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">📧 New Feedback Received</h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Company:</strong> ${feedback.companyName}</p>
            <p><strong>From:</strong> ${feedback.email}</p>
            <p><strong>Date:</strong> ${new Date(feedback.createdAt).toLocaleString()}</p>
          </div>

          <h3 style="color: #3498db;">${feedback.subject}</h3>
          
          <div style="margin: 20px 0;">
            <p><strong>Rating:</strong> ${ratingStars} (${feedback.rating}/5)</p>
            <p><strong>Category:</strong> ${categoryLabels[feedback.category] || feedback.category}</p>
            <p><strong>Status:</strong> <span style="background-color: #e3f2fd; padding: 5px 10px; border-radius: 4px;">${statusLabels[feedback.status]}</span></p>
          </div>

          <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0;">
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${feedback.message}</p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #7f8c8d; font-size: 12px;">This is an automated notification. Please review and update the feedback status in the admin panel.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ Feedback notification sent to ${adminEmail}`);
  } catch (error) {
    console.error('Error sending feedback notification email:', error.message);
    // Don't throw - feedback should still be saved even if email fails
  }
};

// Send feedback confirmation email to superadmin
const sendFeedbackConfirmationEmail = async (user, feedback) => {
  try {
    const categoryLabels = {
      feature_request: "Feature Request",
      bug_report: "Bug Report",
      performance: "Performance",
      ui_ux: "UI/UX",
      general: "General"
    };

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: user.email,
      subject: 'Thank you for your feedback!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #27ae60;">✅ Feedback Received</h2>
          
          <p>Dear ${user.name},</p>
          
          <p>Thank you for taking the time to share your feedback with us! We appreciate your valuable input and suggestions.</p>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Subject:</strong> ${feedback.subject}</p>
            <p><strong>Category:</strong> ${categoryLabels[feedback.category] || feedback.category}</p>
            <p><strong>Rating:</strong> ${"⭐".repeat(feedback.rating)} (${feedback.rating}/5)</p>
            <p><strong>Submitted:</strong> ${new Date(feedback.createdAt).toLocaleString()}</p>
            <p><strong>Status:</strong> New (Pending Review)</p>
          </div>

          <p>Our team will review your feedback and take appropriate action. You can track the status of your feedback anytime by visiting the Feedback section in your CRM dashboard.</p>

          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <strong>💡 What happens next?</strong>
            <ul>
              <li>Our team reviews your feedback</li>
              <li>We prioritize based on impact and feasibility</li>
              <li>You'll see status updates in your dashboard</li>
              <li>Major updates are communicated via email</li>
            </ul>
          </div>

          <p>If you have any questions or additional feedback, feel free to submit more suggestions anytime.</p>

          <p>Best regards,<br><strong>CRM Team</strong></p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #7f8c8d; font-size: 12px;">This is an automated confirmation email. Please do not reply to this email.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ Feedback confirmation email sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending feedback confirmation email:', error.message);
    // Don't throw - feedback should still be saved even if email fails
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
  sendMeetingReminderEmail,
  sendFormNotificationEmail,
  sendFeedbackNotificationEmail,
  sendFeedbackConfirmationEmail,
};

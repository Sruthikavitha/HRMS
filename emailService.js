/**
 * Email Service - Automated Candidate Notifications
 * Sends emails for job postings, application status changes, and interview schedules
 */

const nodemailer = require('nodemailer');
const db = require('./db');

// ==================== Email Configuration ====================

/**
 * Configure email transporter
 * In production, use environment variables for credentials
 */
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true' || false,
  auth: {
    user: process.env.EMAIL_USER || 'noreply@hrms.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
});

// Email templates
const emailTemplates = {
  applicationConfirmation: (candidateName, jobTitle, companyName) => ({
    subject: `Application Confirmation - ${jobTitle}`,
    html: `
      <h2>Application Received</h2>
      <p>Dear ${candidateName},</p>
      <p>Thank you for applying for the <strong>${jobTitle}</strong> position at ${companyName}.</p>
      <p>We have received your application and will review it carefully. If your profile matches our requirements, we will contact you for the next steps.</p>
      <p>Application Status: <strong style="color: #4CAF50;">Applied</strong></p>
      <p>Best regards,<br>${companyName} Recruitment Team</p>
      <hr>
      <p style="font-size: 12px; color: #999;">
        This is an automated email. Please do not reply to this address.
      </p>
    `
  }),

  shortlistedNotification: (candidateName, jobTitle, companyName, nextSteps) => ({
    subject: `Great News! You've Been Shortlisted - ${jobTitle}`,
    html: `
      <h2>Congratulations!</h2>
      <p>Dear ${candidateName},</p>
      <p>We are excited to inform you that you have been <strong>shortlisted</strong> for the ${jobTitle} position!</p>
      <p>Your profile stood out among other applicants, and we would like to learn more about you.</p>
      <p><strong>Next Steps:</strong></p>
      <p>${nextSteps || 'Our team will contact you shortly to schedule an interview. Please keep your contact information updated.'}</p>
      <p>Application Status: <strong style="color: #2196F3;">Shortlisted</strong></p>
      <p>Best regards,<br>${companyName} Recruitment Team</p>
      <hr>
      <p style="font-size: 12px; color: #999;">
        This is an automated email. Please do not reply to this address.
      </p>
    `
  }),

  interviewScheduled: (candidateName, jobTitle, interviewDate, interviewer, location, companyName) => ({
    subject: `Interview Scheduled - ${jobTitle}`,
    html: `
      <h2>Interview Invitation</h2>
      <p>Dear ${candidateName},</p>
      <p>You are invited to interview for the <strong>${jobTitle}</strong> position.</p>
      <p><strong>Interview Details:</strong></p>
      <ul>
        <li><strong>Date & Time:</strong> ${new Date(interviewDate).toLocaleString()}</li>
        <li><strong>Interviewer:</strong> ${interviewer}</li>
        <li><strong>Location:</strong> ${location || 'To be confirmed'}</li>
      </ul>
      <p>Please confirm your attendance by replying to this email or contacting us at the number provided.</p>
      <p>Application Status: <strong style="color: #FF9800;">Interview Scheduled</strong></p>
      <p>Best regards,<br>${companyName} Recruitment Team</p>
      <hr>
      <p style="font-size: 12px; color: #999;">
        This is an automated email. Please do not reply to this address.
      </p>
    `
  }),

  selectedNotification: (candidateName, jobTitle, companyName, nextSteps) => ({
    subject: `Congratulations! You're Selected - ${jobTitle}`,
    html: `
      <h2>Excellent News!</h2>
      <p>Dear ${candidateName},</p>
      <p>We are delighted to inform you that you have been <strong>selected</strong> for the ${jobTitle} position!</p>
      <p>Your skills and experience impressed our team, and we are confident that you will be a great addition to our company.</p>
      <p><strong>Next Steps:</strong></p>
      <p>${nextSteps || 'Our HR team will contact you with the offer details and onboarding information.'}</p>
      <p>Application Status: <strong style="color: #4CAF50;">Selected</strong></p>
      <p>Best regards,<br>${companyName} Recruitment Team</p>
      <hr>
      <p style="font-size: 12px; color: #999;">
        This is an automated email. Please do not reply to this address.
      </p>
    `
  }),

  rejectionNotification: (candidateName, jobTitle, companyName, reason) => ({
    subject: `Application Status Update - ${jobTitle}`,
    html: `
      <h2>Application Status</h2>
      <p>Dear ${candidateName},</p>
      <p>Thank you for your interest in the ${jobTitle} position at ${companyName}.</p>
      <p>After careful review of your application, we have decided to move forward with other candidates whose profile closely matches our current requirements.</p>
      ${reason ? `<p><strong>Feedback:</strong> ${reason}</p>` : ''}
      <p>We appreciate your time and effort in applying. We encourage you to apply for other positions that match your skills in the future.</p>
      <p>Application Status: <strong style="color: #F44336;">Not Selected</strong></p>
      <p>Best regards,<br>${companyName} Recruitment Team</p>
      <hr>
      <p style="font-size: 12px; color: #999;">
        This is an automated email. Please do not reply to this address.
      </p>
    `
  }),

  jobPostingNotification: (email, jobTitle, department, location, link) => ({
    subject: `New Job Opening - ${jobTitle}`,
    html: `
      <h2>New Job Opportunity</h2>
      <p>Dear Candidate,</p>
      <p>We are excited to announce a new job opening for the position of <strong>${jobTitle}</strong>.</p>
      <p><strong>Position Details:</strong></p>
      <ul>
        <li><strong>Department:</strong> ${department}</li>
        <li><strong>Location:</strong> ${location}</li>
      </ul>
      <p>If you are interested in this opportunity, please click the link below to view more details and apply:</p>
      <p><a href="${link}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Job & Apply</a></p>
      <p>Application Deadline: Check the job posting for details.</p>
      <p>Best regards,<br>Recruitment Team</p>
      <hr>
      <p style="font-size: 12px; color: #999;">
        This is an automated email. Please do not reply to this address.
      </p>
    `
  })
};

// ==================== Email Sending Functions ====================

/**
 * Send application confirmation email
 * @param {object} candidate - Candidate object
 * @param {object} posting - Job posting object
 * @returns {Promise<object>} Send result
 */
async function sendApplicationConfirmation(candidate, posting) {
  try {
    const template = emailTemplates.applicationConfirmation(
      candidate.candidateName,
      posting.title,
      process.env.COMPANY_NAME || 'HRMS Company'
    );

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@hrms.com',
      to: candidate.email,
      subject: template.subject,
      html: template.html
    };

    const result = await transporter.sendMail(mailOptions);
    
    logEmailSent(candidate.id, 'applicationConfirmation', result.messageId, candidate.email);
    
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending application confirmation:', error);
    logEmailError(candidate.id, 'applicationConfirmation', error.message);
    throw error;
  }
}

/**
 * Send shortlisted notification email
 * @param {object} candidate - Candidate object
 * @param {object} posting - Job posting object
 * @param {string} nextSteps - Optional next steps message
 * @returns {Promise<object>} Send result
 */
async function sendShortlistedNotification(candidate, posting, nextSteps = '') {
  try {
    const template = emailTemplates.shortlistedNotification(
      candidate.candidateName,
      posting.title,
      process.env.COMPANY_NAME || 'HRMS Company',
      nextSteps
    );

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@hrms.com',
      to: candidate.email,
      subject: template.subject,
      html: template.html
    };

    const result = await transporter.sendMail(mailOptions);
    
    logEmailSent(candidate.id, 'shortlistedNotification', result.messageId, candidate.email);
    
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending shortlisted notification:', error);
    logEmailError(candidate.id, 'shortlistedNotification', error.message);
    throw error;
  }
}

/**
 * Send interview scheduled notification
 * @param {object} candidate - Candidate object
 * @param {object} posting - Job posting object
 * @param {object} interview - Interview details { date, interviewer, location }
 * @returns {Promise<object>} Send result
 */
async function sendInterviewScheduled(candidate, posting, interview) {
  try {
    const template = emailTemplates.interviewScheduled(
      candidate.candidateName,
      posting.title,
      interview.date,
      interview.interviewer,
      interview.location,
      process.env.COMPANY_NAME || 'HRMS Company'
    );

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@hrms.com',
      to: candidate.email,
      subject: template.subject,
      html: template.html
    };

    const result = await transporter.sendMail(mailOptions);
    
    logEmailSent(candidate.id, 'interviewScheduled', result.messageId, candidate.email);
    
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending interview scheduled:', error);
    logEmailError(candidate.id, 'interviewScheduled', error.message);
    throw error;
  }
}

/**
 * Send selection notification email
 * @param {object} candidate - Candidate object
 * @param {object} posting - Job posting object
 * @param {string} nextSteps - Optional next steps message
 * @returns {Promise<object>} Send result
 */
async function sendSelectedNotification(candidate, posting, nextSteps = '') {
  try {
    const template = emailTemplates.selectedNotification(
      candidate.candidateName,
      posting.title,
      process.env.COMPANY_NAME || 'HRMS Company',
      nextSteps
    );

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@hrms.com',
      to: candidate.email,
      subject: template.subject,
      html: template.html
    };

    const result = await transporter.sendMail(mailOptions);
    
    logEmailSent(candidate.id, 'selectedNotification', result.messageId, candidate.email);
    
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending selection notification:', error);
    logEmailError(candidate.id, 'selectedNotification', error.message);
    throw error;
  }
}

/**
 * Send rejection notification email
 * @param {object} candidate - Candidate object
 * @param {object} posting - Job posting object
 * @param {string} reason - Rejection reason
 * @returns {Promise<object>} Send result
 */
async function sendRejectionNotification(candidate, posting, reason = '') {
  try {
    const template = emailTemplates.rejectionNotification(
      candidate.candidateName,
      posting.title,
      process.env.COMPANY_NAME || 'HRMS Company',
      reason
    );

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@hrms.com',
      to: candidate.email,
      subject: template.subject,
      html: template.html
    };

    const result = await transporter.sendMail(mailOptions);
    
    logEmailSent(candidate.id, 'rejectionNotification', result.messageId, candidate.email);
    
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending rejection notification:', error);
    logEmailError(candidate.id, 'rejectionNotification', error.message);
    throw error;
  }
}

/**
 * Send job posting notification to subscribers
 * @param {object} posting - Job posting object
 * @param {array} emails - List of recipient emails
 * @returns {Promise<object>} Send result
 */
async function sendJobPostingNotification(posting, emails) {
  try {
    if (!Array.isArray(emails) || emails.length === 0) {
      throw new Error('No recipient emails provided');
    }

    const template = emailTemplates.jobPostingNotification(
      emails[0], // Primary recipient
      posting.title,
      posting.department,
      posting.location,
      process.env.COMPANY_WEBSITE || 'https://hrms.example.com'
    );

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@hrms.com',
      to: emails.join(','),
      subject: template.subject,
      html: template.html
    };

    const result = await transporter.sendMail(mailOptions);
    
    return { success: true, recipientCount: emails.length, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending job posting notification:', error);
    throw error;
  }
}

/**
 * Send bulk status update emails
 * @param {array} candidateIds - Array of candidate IDs
 * @param {string} newStatus - New status
 * @returns {Promise<object>} Results
 */
async function sendBulkStatusUpdate(candidateIds, newStatus) {
  try {
    const results = {
      success: [],
      failed: []
    };

    for (const candidateId of candidateIds) {
      try {
        const candidate = db.data.candidates?.find(c => c.id === candidateId);
        const posting = db.data.jobPostings?.find(p => p.id === candidate.jobPostingId);

        if (!candidate || !posting) {
          results.failed.push({ candidateId, reason: 'Candidate or posting not found' });
          continue;
        }

        let sendFn;
        switch (newStatus) {
          case 'shortlisted':
            await sendShortlistedNotification(candidate, posting);
            break;
          case 'selected':
            await sendSelectedNotification(candidate, posting);
            break;
          case 'rejected':
            await sendRejectionNotification(candidate, posting);
            break;
          default:
            results.failed.push({ candidateId, reason: `Unsupported status: ${newStatus}` });
            continue;
        }

        results.success.push(candidateId);
      } catch (error) {
        results.failed.push({ candidateId, reason: error.message });
      }
    }

    return results;
  } catch (error) {
    throw new Error(`Bulk email send failed: ${error.message}`);
  }
}

// ==================== Email Logging ====================

/**
 * Log successful email send
 * @param {number} candidateId - Candidate ID
 * @param {string} emailType - Type of email sent
 * @param {string} messageId - Email message ID
 * @param {string} recipientEmail - Recipient email address
 */
function logEmailSent(candidateId, emailType, messageId, recipientEmail) {
  if (!db.data.emailLogs) {
    db.data.emailLogs = [];
  }

  db.data.emailLogs.push({
    id: db.nextId('emailLogs'),
    candidateId,
    emailType,
    messageId,
    recipientEmail,
    status: 'sent',
    timestamp: new Date().toISOString()
  });

  db.write();
}

/**
 * Log email send error
 * @param {number} candidateId - Candidate ID
 * @param {string} emailType - Type of email attempted
 * @param {string} errorMessage - Error message
 */
function logEmailError(candidateId, emailType, errorMessage) {
  if (!db.data.emailLogs) {
    db.data.emailLogs = [];
  }

  db.data.emailLogs.push({
    id: db.nextId('emailLogs'),
    candidateId,
    emailType,
    status: 'failed',
    error: errorMessage,
    timestamp: new Date().toISOString()
  });

  db.write();
}

/**
 * Get email logs for candidate
 * @param {number} candidateId - Candidate ID
 * @returns {array} Email logs
 */
function getEmailLogs(candidateId) {
  return (db.data.emailLogs || []).filter(log => log.candidateId === candidateId);
}

/**
 * Verify email transporter configuration
 * @returns {Promise<boolean>} True if transporter is working
 */
async function verifyEmailConfig() {
  try {
    await transporter.verify();
    console.log('Email transporter verified successfully');
    return true;
  } catch (error) {
    console.error('Email transporter verification failed:', error.message);
    return false;
  }
}

// ==================== Exports ====================

module.exports = {
  // Email sending
  sendApplicationConfirmation,
  sendShortlistedNotification,
  sendInterviewScheduled,
  sendSelectedNotification,
  sendRejectionNotification,
  sendJobPostingNotification,
  sendBulkStatusUpdate,

  // Email logging
  logEmailSent,
  logEmailError,
  getEmailLogs,

  // Utilities
  verifyEmailConfig,
  transporter
};

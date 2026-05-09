const nodemailer = require('nodemailer');
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, NODE_ENV } = require('../config/env');
const logger = require('./logger');

let transporter;

try {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    tls: { rejectUnauthorized: false },
  });
} catch (err) {
  logger.warn('Email transporter failed to initialise — emails disabled.');
}

const sendEmail = async ({ to, subject, html, text }) => {
  if (NODE_ENV === 'development') {
    logger.info(`📧 [DEV] Email suppressed — To: ${to} | Subject: ${subject}`);
    return { suppressed: true };
  }
  if (!transporter) {
    logger.warn('Email transporter not available.');
    return { error: 'No transporter' };
  }
  try {
    const info = await transporter.sendMail({
      from: `"EMS System" <${SMTP_USER}>`,
      to, subject,
      html: html || `<p>${text}</p>`,
      text: text || '',
    });
    logger.info(`📧 Email sent: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error(`📧 Email failed: ${err.message}`);
    return { error: err.message }; // Don't throw — email failure ≠ request failure
  }
};

const templates = {
  leaveApproved: (name, dates) => ({
    subject: 'Leave Request Approved ✅',
    html: `<h3>Hi ${name},</h3><p>Your leave from <b>${dates.start}</b> to <b>${dates.end}</b> has been <b>approved</b>.</p>`,
  }),
  leaveRejected: (name, reason) => ({
    subject: 'Leave Request Update',
    html: `<h3>Hi ${name},</h3><p>Your leave request was <b>rejected</b>. Reason: ${reason || 'See admin note.'}</p>`,
  }),
  payrollFinalized: (name, period, netPay) => ({
    subject: `Payslip Ready — ${period}`,
    html: `<h3>Hi ${name},</h3><p>Your payslip for <b>${period}</b> is ready. Net Pay: <b>${netPay}</b>.</p>`,
  }),
  welcome: (name) => ({
    subject: 'Welcome to the Team! 🎉',
    html: `<h3>Hi ${name},</h3><p>Welcome aboard! Your account is set up. Please log in to complete your onboarding.</p>`,
  }),
};

module.exports = { sendEmail, templates };
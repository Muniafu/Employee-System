const nodemailer = require('nodemailer');
const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
} = require('../config/env');
const logger = require('./logger');
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: false,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

transporter.verify((error) => {
  if (error) {
    logger.error(`SMTP Verification Failed: ${error.message}`);
  } else {
    logger.info('SMTP Server Ready');
  }
});

const sendEmail = async ({
  to,
  subject,
  html,
  text,
}) => {
  try {
    logger.info(
      `Attempting email -> ${to} | Subject: ${subject}`
    );

    const info = await transporter.sendMail({
      from: `"EMS System" <${SMTP_USER}>`,
      to,
      subject,
      html,
      text,
    });

    logger.info(
      `Email Sent: ${info.messageId}`
    );

    return {
      success: true,
      info,
    };
  } catch (err) {
    logger.error(
      `Email Failed: ${err.message}`
    );

    return {
      success: false,
      error: err.message,
    };
  }
};

const templates = {
  leaveApproved: (name, dates) => ({
    subject: 'Leave Request Approved ',
    html: `
      <h2>Leave Approved</h2>
      <p>Hello ${name},</p>
      <p>Your leave request has been approved.</p>
      <p>
        <strong>Start:</strong> ${new Date(dates.start).toLocaleDateString()}
      </p>
      <p>
        <strong>End:</strong> ${new Date(dates.end).toLocaleDateString()}
      </p>
    `,
  }),

  leaveRejected: (name, reason) => ({
    subject: 'Leave Request Rejected',
    html: `
      <h2>Leave Request Update</h2>
      <p>Hello ${name},</p>
      <p>Your leave request was rejected.</p>
      <p><strong>Reason:</strong> ${reason || 'No reason provided'}</p>
    `,
  }),

  payrollFinalized: (
    name,
    period,
    netPay
  ) => ({
    subject: `Payslip Ready - ${period}`,
    html: `
      <h2>Payslip Available</h2>
      <p>Hello ${name},</p>
      <p>Your payroll for ${period} has been finalized.</p>
      <p><strong>Net Pay:</strong> ${netPay}</p>
    `,
  }),

  passwordReset: (name, link) => ({

    subject: "Reset Your Password",

    html: `
        <h2>Password Reset</h2>

        <p>Hello ${name},</p>

        <p>
            A request was made to reset your password.
        </p>

        <p>
            Click below.
        </p>

        <a href="${link}">
            Reset Password
        </a>

        <p>
            This link expires in 15 minutes.
        </p>

        <p>
            If you didn't request this,
            ignore this email.
        </p>
    `,
  }),

  confirmSocialLink: (name, provider, link) => ({

    subject: `Confirm your ${provider} sign-in link`,

    html: `
        <h2>Confirm Account Link</h2>

        <p>Hello ${name},</p>

        <p>
            Someone tried to sign in to your EMS account using
            <strong>${provider}</strong>, but an account with this
            email already exists.
        </p>

        <p>
            If this was you, click below to link your
            ${provider} sign-in to your existing account.
        </p>

        <a href="${link}">
            Confirm and Link Account
        </a>

        <p>
            This link expires in 30 minutes.
        </p>

        <p>
            If you didn't request this, ignore this email — no
            changes will be made and your password login keeps working.
        </p>
    `,
  }),

  welcome: (name) => ({
    subject: 'Welcome to EMS',
    html: `
      <h2>Welcome</h2>
      <p>Hello ${name},</p>
      <p>Your account has been created successfully.</p>
    `,
  }),

  emailVerification: (name, link) => ({
    subject: 'Verify Your Email Address',
    html: `
      <h2>Email Verification</h2>
      <p>Hello ${name},</p>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${link}">Verify Email</a>
      <p>This link expires in 24 hours.</p>
      <p> If you didn't create an account, please ignore this email.</p>
    `,
  }),
};

module.exports = { sendEmail, templates, };
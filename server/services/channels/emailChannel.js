const {
  sendEmail: sendEmailUtil,
} = require('../../utils/emailService');

const sendEmail = async ({
  to,
  subject,
  html,
  text,
}) => {
  if (!to) {
    return {
      success: false,
      error: 'Recipient email missing',
    };
  }

  return sendEmailUtil({
    to,
    subject,
    html,
    text,
  });

  return result;
};

module.exports = {
  sendEmail
};
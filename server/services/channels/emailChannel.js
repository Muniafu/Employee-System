const {
  sendEmail,
} = require('../../utils/emailService');

const sendEmailNotification = async ({
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

  const result = await sendEmail({
    to,
    subject,
    html,
    text,
  });

  return result;
};

module.exports = {
  sendEmailNotification,
};
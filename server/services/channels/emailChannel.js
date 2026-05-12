const {
  sendEmail,
} = require('../../utils/emailService');

const sendEmailNotification =
  async ({
    to,
    subject,
    html,
    text,
  }) => {
    try {
      const result =
        await sendEmail({
          to,
          subject,
          html,
          text,
        });

      return {
        success:
          !result?.error,

        provider: 'smtp',

        result,
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
      };
    }
  };

module.exports = {
  sendEmailNotification,
};
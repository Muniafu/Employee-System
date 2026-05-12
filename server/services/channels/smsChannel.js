const logger =
  require('../../utils/logger');

const sendSMSNotification =
  async ({
    phoneNumber,
    message,
  }) => {
    try {
      logger.info(
        `[SMS] ${phoneNumber}: ${message}`
      );

      /*
        Future:
        Twilio
        Africa's Talking
        AWS SNS
      */

      return {
        success: true,
        provider: 'mock-sms',
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
      };
    }
  };

module.exports = {
  sendSMSNotification,
};
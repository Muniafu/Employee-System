const logger =
  require('../utils/logger');

const {
  sendInAppNotification,
} = require('./channels/inAppChannel');

const {
  sendEmailNotification,
} = require('./channels/emailChannel');

const {
  sendSMSNotification,
} = require('./channels/smsChannel');

const dispatchNotification =
  async ({
    recipient,
    sender = null,

    channels = ['inApp'],

    type = 'system',

    title,
    message,

    email = null,
    phoneNumber = null,

    emailContent = {},

    smsMessage = '',

    data = {},
    link = '',

    priority = 'medium',
  }) => {
    const results = {
      inApp: null,
      email: null,
      sms: null,
    };

    await Promise.allSettled([
      channels.includes(
        'inApp'
      )
        ? sendInAppNotification({
            recipient,
            sender,

            type,

            title,
            message,

            data,
            link,

            priority,
          }).then((result) => {
            results.inApp = {
              success: true,
              result,
            };
          })
        : null,

      channels.includes(
        'email'
      ) &&
      email
        ? sendEmailNotification({
            to: email,

            subject:
              emailContent.subject ||
              title,

            html:
              emailContent.html ||
              `<p>${message}</p>`,

            text:
              emailContent.text ||
              message,
          }).then((result) => {
            results.email =
              result;
          })
        : null,

      channels.includes(
        'sms'
      ) &&
      phoneNumber
        ? sendSMSNotification({
            phoneNumber,

            message:
              smsMessage ||
              message,
          }).then((result) => {
            results.sms =
              result;
          })
        : null,
    ]);

    logger.info(
      `Notification dispatched: ${title}`
    );

    return results;
  };

module.exports = {
  dispatchNotification,
};
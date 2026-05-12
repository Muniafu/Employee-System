const {
  createNotification,
} = require('../../utils/notificationService');

const sendInAppNotification =
  async ({
    recipient,
    sender = null,
    type = 'system',
    title,
    message,
    data = {},
    link = '',
    priority = 'medium',
  }) => {
    return createNotification({
      recipient,
      sender,
      type,
      title,
      message,
      data,
      link,
      priority,
    });
  };

module.exports = {
  sendInAppNotification,
};
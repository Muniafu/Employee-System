const Notification = require('../models/Notification');
const logger = require('./logger');

const createNotification = async ({ recipient, type, title, message, data = {}, link = '', priority = 'medium' }) => {
  try {
    const notification = await Notification.create({ recipient, type, title, message, data, link, priority });
    return notification;
  } catch (err) {
    logger.error(`Notification creation failed: ${err.message}`);
    return null; // Non-blocking
  }
};

const markRead = async (notificationId, userId) => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { read: true, readAt: new Date() },
    { new: true }
  );
};

const getUserNotifications = async (userId, unreadOnly = false) => {
  const filter = { recipient: userId };
  if (unreadOnly) filter.read = false;
  return Notification.find(filter).sort({ createdAt: -1 }).limit(50);
};

module.exports = { createNotification, markRead, getUserNotifications };
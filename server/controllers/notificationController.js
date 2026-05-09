const { getUserNotifications, markRead } = require('../utils/notificationService');
const Notification = require('../models/Notification');

// GET /api/notifications
exports.getAll = async (req, res, next) => {
  try {
    const unreadOnly = req.query.unread === 'true';
    const notifications = await getUserNotifications(req.user._id, unreadOnly);
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, read: false });
    res.status(200).json({ success: true, count: notifications.length, unreadCount, data: notifications });
  } catch (err) { next(err); }
};

// GET /api/notifications/unread-count
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    res.status(200).json({
      success: true,
      data: {
        count,
      },
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/notifications/:id/read
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await markRead(req.params.id, req.user._id);
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' });
    res.status(200).json({ success: true, data: notification });
  } catch (err) { next(err); }
};

// PATCH /api/notifications/read-all
exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true, readAt: new Date() });
    res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) { next(err); }
};

// DELETE /api/notifications/:id
exports.remove = async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
    res.status(200).json({ success: true, message: 'Notification deleted.' });
  } catch (err) { next(err); }
};
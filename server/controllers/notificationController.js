const Notification = require('../models/Notification');

exports.getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });

        res.json({
            success: true,
            data: notifications
        });
    } catch (err) {
        next(err);
    }
};

exports.markAsRead = async (req, res, next) => {
    try {
        await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { read: true }
        );

        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (err) {
        next(err);
    }
};
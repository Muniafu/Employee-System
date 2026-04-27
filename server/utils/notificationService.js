const Notification = require('../models/Notification');
const Employee = require('../models/Employee');
const { sendEmail } = require('./emailService');

// Create and send notification
exports.notifyUser = async (userId, type, message, emailSubject) => {
    // 1. Always create in-app notification
    await Notification.create({
        user: userId,
        type,
        message,
    });

    // 2. Send email notification if emailSubject is provided (asnyc, best-effort)
    try {
        const user = await Employee.findById(userId);
        if (!user?.email) return;

        sendEmail({
            to: user.email,
            subject: emailSubject || 'Notification from HR Management System',
            text: message
        });
    } catch (err) {
        // silently fail email sending errors
    }
};
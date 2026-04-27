const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
        index: true
    },

    type: {
        type: String,
        enum: ['leave', 'payroll', 'general'],
        required: true
    },

    message: { type: String, required: true },
    read: { type: Boolean, default: false }

}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
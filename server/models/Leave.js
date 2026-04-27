const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
        index: true
    },

    organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
    },

    type: {
        type: String,
        enum: ['sick', 'vacation', 'personal', 'maternity', 'unpaid', 'paternity', 'other'],
        required: true
    },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
        index: true
    },

    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
    }
}, { timestamps: true });

leaveSchema.pre('save', function (next) {
    if (this.endDate < this.startDate) {
        return next(new Error('End date must be after start date'));
    }
    next();
});

module.exports = mongoose.model('Leave', leaveSchema);
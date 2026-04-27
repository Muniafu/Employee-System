const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
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

    date: {
        type: Date,
        required: true,
    },

    clockIn: { type: Date, required: true },
    clockOut: { type: Date },

    totalHours: { type: Number, default: 0 },

}, { timestamps: true });

attendanceSchema.index(
    { employee: 1, date: 1 }, 
    { unique: true }
);

attendanceSchema.pre('save', function (next) {
    if (this.clockOut && this.clockOut <= this.clockIn) {
        return next(new Error('Clock-out time must be after clock-in time'));
    }

    if (this.clockIn && this.clockOut) {
        this.totalHours = (this.clockOut - this.clockIn) / (1000 * 60 * 60);
    }
    next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);
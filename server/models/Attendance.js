const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },

    date: {
      type: String,
      required: true,
      index: true,
    },

    clockIn: {
      type: Date,
    },

    clockOut: {
      type: Date,
    },

    hoursWorked: {
      type: Number,
      default: 0,
    },

    overtime: {
      type: Number,
      default: 0,
    },

    isLate: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: [
        'present',
        'absent',
        'half_day',
        'late',
        'on_leave',
      ],
      default: 'present',
    },

    location: {
      type: String,
      default: 'office',
    },

    note: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index(
  {
    employee: 1,
    date: 1,
  },
  {
    unique: true,
  }
);

attendanceSchema.methods.calculateHours = function () {
  if (this.clockIn && this.clockOut) {
    const diff = this.clockOut - this.clockIn;

    this.hoursWorked = parseFloat(
      (diff / (1000 * 60 * 60)).toFixed(2)
    );

    this.overtime = Math.max(
      0,
      parseFloat((this.hoursWorked - 8).toFixed(2))
    );
  }
};

module.exports = mongoose.model(
  'Attendance',
  attendanceSchema
);
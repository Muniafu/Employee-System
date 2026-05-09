const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  employee:    { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  leaveType:   { type: String, enum: ['annual', 'sick', 'maternity', 'paternity', 'unpaid', 'other'], required: true },
  startDate:   { type: Date, required: true },
  endDate:     { type: Date, required: true },
  totalDays:   { type: Number },
  reason:      { type: String, maxlength: 500, default: '' },
  status:      { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending' },
  approvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt:  { type: Date },
  adminNote:   { type: String, default: '' },
  attachments: [{ type: String }],
}, { timestamps: true });

leaveSchema.pre('validate', function (next) {
  if (this.endDate && this.startDate && this.endDate < this.startDate) {
    this.invalidate('endDate', 'End date must be on or after start date');
  }
  next();
});

leaveSchema.pre('save', function (next) {
  if (this.startDate && this.endDate) {
    const ms = this.endDate - this.startDate;
    this.totalDays = Math.ceil(ms / (1000 * 60 * 60 * 24)) + 1;
  }
  next();
});

module.exports = mongoose.model('Leave', leaveSchema);
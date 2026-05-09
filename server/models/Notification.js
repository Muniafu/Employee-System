const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:       { type: String, enum: ['leave', 'payroll', 'performance', 'compliance', 'onboarding', 'system', 'wellness', 'engagement'], default: 'system' },
  title:      { type: String, required: true },
  message:    { type: String, required: true },
  read:       { type: Boolean, default: false },
  readAt:     { type: Date },
  data:       { type: mongoose.Schema.Types.Mixed }, // additional context
  link:       { type: String, default: '' },
  priority:   { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
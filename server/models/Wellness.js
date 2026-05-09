const mongoose = require('mongoose');

const wellnessSchema = new mongoose.Schema({
  title:        { type: String, required: true },
  description:  { type: String, default: '' },
  category:     { type: String, enum: ['mental_health', 'physical', 'financial', 'social', 'eap', 'other'], default: 'other' },
  type:         { type: String, enum: ['program', 'resource', 'challenge', 'session'], default: 'program' },
  provider:     { type: String, default: '' },
  startDate:    { type: Date },
  endDate:      { type: Date },
  isActive:     { type: Boolean, default: true },
  maxCapacity:  { type: Number, default: 100 },
  enrollments:  [{
    employee:    { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    enrolledAt:  { type: Date, default: Date.now },
    status:      { type: String, enum: ['enrolled', 'completed', 'withdrawn'], default: 'enrolled' },
    completedAt: { type: Date },
    feedback:    { type: String, default: '' },
  }],
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content:      { type: String, default: '' }, // URL or text
  tags:         [String],
}, { timestamps: true });

module.exports = mongoose.model('Wellness', wellnessSchema);
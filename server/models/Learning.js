const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  employee:    { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  enrolledAt:  { type: Date, default: Date.now },
  completedAt: { type: Date },
  progress:    { type: Number, min: 0, max: 100, default: 0 },
  score:       { type: Number },
  status:      { type: String, enum: ['enrolled', 'in_progress', 'completed', 'failed'], default: 'enrolled' },
  certificate: { type: String, default: '' },
});

const learningSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category:    { type: String, enum: ['compliance', 'technical', 'leadership', 'soft_skills', 'safety', 'other'], default: 'other' },
  duration:    { type: Number, default: 0 }, // minutes
  isMandatory: { type: Boolean, default: false },
  expiryDays:  { type: Number, default: 365 }, // certificate validity
  content:     { type: String, default: '' }, // URL or text
  provider:    { type: String, default: '' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive:    { type: Boolean, default: true },
  enrollments: [enrollmentSchema],
  passingScore:{ type: Number, default: 70 },
}, { timestamps: true });

module.exports = mongoose.model('Learning', learningSchema);
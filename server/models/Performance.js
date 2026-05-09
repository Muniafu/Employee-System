const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  target:      { type: String, default: '' },
  progress:    { type: Number, min: 0, max: 100, default: 0 },
  status:      { type: String, enum: ['not_started', 'in_progress', 'completed', 'missed'], default: 'not_started' },
  dueDate:     { type: Date },
});

const performanceSchema = new mongoose.Schema({
  employee:     { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  reviewer:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  period:       { type: String, required: true }, // e.g. "2024-Q4"
  reviewType:   { type: String, enum: ['quarterly', 'annual', 'probation', 'pip'], default: 'quarterly' },
  goals:        [goalSchema],
  overallRating:{ type: Number, min: 1, max: 5 },
  managerRating:{ type: Number, min: 1, max: 5 },
  selfRating:   { type: Number, min: 1, max: 5 },
  strengths:    { type: String, default: '' },
  improvements: { type: String, default: '' },
  managerComment:{ type: String, default: '' },
  status:       { type: String, enum: ['draft', 'submitted', 'reviewed', 'acknowledged'], default: 'draft' },
  submittedAt:  { type: Date },
  reviewedAt:   { type: Date },
}, { timestamps: true });

performanceSchema.index({ employee: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('Performance', performanceSchema);
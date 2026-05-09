const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  employee:   { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  answers:    [{ question: String, answer: mongoose.Schema.Types.Mixed, rating: Number }],
  submittedAt:{ type: Date, default: Date.now },
  npsScore:   { type: Number, min: 0, max: 10 },
  anonymous:  { type: Boolean, default: false },
});

const engagementSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  type:        { type: String, enum: ['pulse', 'nps', 'satisfaction', 'recognition', 'announcement'], default: 'pulse' },
  questions:   [{ text: String, type: { type: String, enum: ['text', 'rating', 'boolean', 'choice'] }, options: [String], required: { type: Boolean, default: false } }],
  responses:   [responseSchema],
  startDate:   { type: Date, default: Date.now },
  endDate:     { type: Date },
  isActive:    { type: Boolean, default: true },
  targetDept:  { type: String, default: 'all' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  anonymous:   { type: Boolean, default: false },
  avgNps:      { type: Number, default: 0 },
  avgSatisfaction: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Engagement', engagementSchema);
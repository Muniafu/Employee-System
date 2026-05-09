const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  period:      { type: String, required: true }, // YYYY-MM
  type:        { type: String, enum: ['headcount', 'attendance', 'payroll', 'leave', 'performance', 'engagement', 'turnover'], required: true },
  data:        { type: mongoose.Schema.Types.Mixed, required: true },
  generatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

analyticsSchema.index({ period: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Analytics', analyticsSchema);
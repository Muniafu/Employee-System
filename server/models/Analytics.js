const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },

  type: {
    type: String,
    enum: ['dashboard', 'attendance', 'payroll'],
    required: true
  },

  data: { type: Object, required: true },

  generatedAt: {
    type: Date,
    default: Date.now,
    index: true
  }

}, { timestamps: true });

module.exports = mongoose.model('Analytics', analyticsSchema);
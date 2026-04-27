const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },

  period: {
    quarter: { type: Number, min: 1, max: 4 },
    year: { type: Number, required: true }
  },

  goals: [
    {
      title: String,
      description: String,
      achieved: { type: Boolean, default: false }
    }
  ],

  rating: {
    type: Number,
    min: 1,
    max: 5
  },

  feedback: String,

  status: {
    type: String,
    enum: ['draft', 'finalized'],
    default: 'draft'
  }

}, { timestamps: true });

performanceSchema.index(
  { employee: 1, 'period.quarter': 1, 'period.year': 1 },
  { unique: true }
);

module.exports = mongoose.model('Performance', performanceSchema);
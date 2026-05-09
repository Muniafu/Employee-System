const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  title:         { type: String, required: true },
  category:      { type: String, enum: ['hr', 'it', 'finance', 'operations', 'legal', 'health_safety', 'other'], default: 'hr' },
  content:       { type: String, required: true },
  version:       { type: String, default: '1.0' },
  effectiveDate: { type: Date, required: true },
  reviewDate:    { type: Date },
  isActive:      { type: Boolean, default: true },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tags:          [String],
  attachmentUrl: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Policy', policySchema);
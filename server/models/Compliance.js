const mongoose = require('mongoose');

const acknowledgmentSchema = new mongoose.Schema({
  employee:       { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  acknowledgedAt: { type: Date, default: Date.now },
  ipAddress:      { type: String, default: '' },
  signature:      { type: String, default: '' },
});

const complianceSchema = new mongoose.Schema({
  title:           { type: String, required: true },
  type:            { type: String, enum: ['policy', 'training', 'certification', 'audit', 'declaration'], default: 'policy' },
  description:     { type: String, default: '' },
  content:         { type: String, default: '' },
  version:         { type: String, default: '1.0' },
  effectiveDate:   { type: Date, required: true },
  expiryDate:      { type: Date },
  isActive:        { type: Boolean, default: true },
  isMandatory:     { type: Boolean, default: true },
  targetRoles:     [{ type: String }],
  acknowledgments: [acknowledgmentSchema],
  createdBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tags:            [String],
}, { timestamps: true });

module.exports = mongoose.model('Compliance', complianceSchema);
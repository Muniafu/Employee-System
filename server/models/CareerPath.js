const mongoose = require('mongoose');

const careerPathSchema = new mongoose.Schema({
  employee:        { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  currentRole:     { type: String, required: true },
  targetRole:      { type: String, required: true },
  timeline:        { type: String, default: '12 months' },
  skills:          [{ name: String, level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] }, acquired: { type: Boolean, default: false } }],
  milestones:      [{ title: String, description: String, targetDate: Date, completed: { type: Boolean, default: false }, completedAt: Date }],
  mentor:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status:          { type: String, enum: ['active', 'completed', 'paused', 'abandoned'], default: 'active' },
  notes:           { type: String, default: '' },
  approvedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  successionFlag:  { type: Boolean, default: false }, // marked as successor
}, { timestamps: true });

module.exports = mongoose.model('CareerPath', careerPathSchema);
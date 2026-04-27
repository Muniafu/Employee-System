const mongoose = require('mongoose');

const successorSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  readinessLevel: {
    type: String,
    enum: ['ready-now', '1-2-years', '3-5-years'],
    default: '1-2-years'
  }
});

const careerPathSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },

  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  currentRole: {
    type: String,
    required: true
  },

  targetRole: {
    type: String,
    required: true
  },

  requiredSkills: [String],

  completedSkills: [String],

  readinessScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },

  successors: [successorSchema], // For role-based succession planning

  status: {
    type: String,
    enum: ['active', 'achieved', 'paused'],
    default: 'active'
  }

}, { timestamps: true });

careerPathSchema.index({ organizationId: 1, employee: 1 }, { unique: true });

module.exports = mongoose.model('CareerPath', careerPathSchema);
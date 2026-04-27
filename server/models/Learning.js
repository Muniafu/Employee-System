const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  status: {
    type: String,
    enum: ['enrolled', 'in-progress', 'completed'],
    default: 'enrolled'
  },

  completedAt: Date
}, { timestamps: true });

const learningSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },

  title: {
    type: String,
    required: true
  },

  description: String,

  contentUrl: String, // video, PDF, SCORM, etc.

  durationMinutes: Number,

  isMandatory: {
    type: Boolean,
    default: false
  },

  enrollments: [enrollmentSchema]

}, { timestamps: true });

learningSchema.index({ organizationId: 1, title: 1 });

module.exports = mongoose.model('Learning', learningSchema);
const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['enrolled', 'completed', 'dropped'],
    default: 'enrolled'
  }
}, { _id: false });

const wellnessSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },

  title: { type: String, required: true },
  description: String,

  type: {
    type: String,
    enum: ['mental', 'physical', 'financial', 'social'],
    default: 'mental'
  },

  active: {
    type: Boolean,
    default: true,
    index: true
  },

  participants: [participantSchema]

}, { timestamps: true });

wellnessSchema.index({ organizationId: 1, title: 1 });

module.exports = mongoose.model('Wellness', wellnessSchema);
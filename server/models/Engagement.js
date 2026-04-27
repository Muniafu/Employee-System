const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  answers: [{
    questionId: String,
    value: Number, // Likert 1–5 (extendable)
    text: String   // optional open-ended
  }],
  submittedAt: { type: Date, default: Date.now }
}, { _id: false });

const questionSchema = new mongoose.Schema({
  _id: false,
  id: { type: String, required: true }, // stable key
  text: { type: String, required: true },
  type: {
    type: String,
    enum: ['scale', 'text'],
    default: 'scale'
  },
  scale: {
    min: { type: Number, default: 1 },
    max: { type: Number, default: 5 }
  }
});

const engagementSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },

  title: { type: String, required: true },
  description: String,

  questions: [questionSchema],

  active: { type: Boolean, default: true, index: true },

  responses: [responseSchema]

}, { timestamps: true });

engagementSchema.index({ organizationId: 1, title: 1 });

module.exports = mongoose.model('Engagement', engagementSchema);
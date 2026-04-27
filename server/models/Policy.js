const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },

  active: { type: Boolean, default: true },

  version: { type: Number, default: 1 },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  }

}, { timestamps: true });

module.exports = mongoose.model('Policy', policySchema);
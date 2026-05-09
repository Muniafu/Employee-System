const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name:      { type: String, required: true, unique: true, trim: true },
  code:      { type: String, unique: true, uppercase: true, trim: true },
  head:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  budget:    { type: Number, default: 0 },
  location:  { type: String, default: '' },
  isActive:  { type: Boolean, default: true },
  parentDept:{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);
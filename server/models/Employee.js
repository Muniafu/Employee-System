const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  employeeId:  { type: String, unique: true },
  department:  { type: String, default: '' },
  position:    { type: String, default: '' },
  phone:       { type: String, default: '' },
  address:     { type: String, default: '' },
  dateOfBirth: { type: Date },
  startDate:   { type: Date, default: Date.now },
  endDate:     { type: Date },
  salary:      { type: Number, default: 0 },
  currency:    { type: String, default: 'KES' },
  profileImage:{ type: String, default: '' },
  manager:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status:      { type: String, enum: ['active', 'on_leave', 'terminated', 'probation'], default: 'active' },
  leaveBalance: {
    annual:    { type: Number, default: 21 },
    sick:      { type: Number, default: 10 },
    maternity: { type: Number, default: 90 },
    paternity: { type: Number, default: 14 },
  },
  emergencyContact: {
    name:         { type: String, default: '' },
    phone:        { type: String, default: '' },
    relationship: { type: String, default: '' },
  },
  bankDetails: {
    bankName:      { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    branchCode:    { type: String, default: '' },
  },
  taxPin:       { type: String, default: '' },
  nssfNumber:   { type: String, default: '' },
  nhifNumber:   { type: String, default: '' },
}, { timestamps: true });

// Auto-generate employeeId before save
employeeSchema.pre('save', async function (next) {
  if (!this.employeeId) {
    this.employeeId = `EMP${Date.now()}`;
  }
  next();
});

module.exports = mongoose.model('Employee', employeeSchema);
const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employee:      { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  period:        { type: String, required: true }, // YYYY-MM format
  basicSalary:   { type: Number, required: true },
  allowances: {
    housing:     { type: Number, default: 0 },
    transport:   { type: Number, default: 0 },
    medical:     { type: Number, default: 0 },
    other:       { type: Number, default: 0 },
  },
  deductions: {
    paye:        { type: Number, default: 0 }, // Tax
    nhif:        { type: Number, default: 0 },
    nssf:        { type: Number, default: 0 },
    loan:        { type: Number, default: 0 },
    other:       { type: Number, default: 0 },
  },
  grossPay:      { type: Number },
  netPay:        { type: Number },
  daysWorked:    { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },
  overtimePay:   { type: Number, default: 0 },
  status:        { type: String, enum: ['draft', 'finalized', 'paid'], default: 'draft' },
  finalizedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  finalizedAt:   { type: Date },
  paymentDate:   { type: Date },
  notes:         { type: String, default: '' },
}, { timestamps: true });

// One payroll per employee per period
payrollSchema.index({ employee: 1, period: 1 }, { unique: true });

payrollSchema.pre('save', function (next) {
  const a = this.allowances;
  const totalAllowances = (a.housing + a.transport + a.medical + a.other);
  this.grossPay = this.basicSalary + totalAllowances + this.overtimePay;

  const d = this.deductions;
  const totalDeductions = (d.paye + d.nhif + d.nssf + d.loan + d.other);
  this.netPay = Math.max(0, this.grossPay - totalDeductions);
  next();
});

module.exports = mongoose.model('Payroll', payrollSchema);
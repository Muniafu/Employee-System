const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
        index: true
    },

    organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
    },

    period: {
        month: { type: Number, min:1, max:12, required: true },
        year: { type: Number, required: true }
    },

    baseSalary: { type: Number, required: true },
    deductions: { type: Number, default: 0 },
    allowances: { type: Number, default: 0 },

    netpay: { type: Number, required: true },

    generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },

    finalized: { type: Boolean, default: false }
}, { timestamps: true });

payrollSchema.index(
    { employee: 1, 'period.month': 1, 'period.year': 1 },
    { unique: true }
);

module.exports = mongoose.model('Payroll', payrollSchema);
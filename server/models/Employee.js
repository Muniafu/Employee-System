const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const ROLES = require('../utils/roles');

const employeeSchema = new mongoose.Schema({
    name: { type: String, required: true },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        index: true
    },

    password: { type: String, required: true },

    role: {
        type: String,
        enum: Object.values(ROLES),
        required: true,
        default: ROLES.EMPLOYEE
    },

    organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
    },

    department: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true
    },

    salary: { 
        type: Number,
        min: 0,
        required: function() {
            return this.role === ROLES.EMPLOYEE;
        } 
    },

    status: {
        type: String,
        enum: ['active', 'inactive', 'terminated'],
        default: 'active',
        required: true
    },
}, { timestamps: true });

// Hash password before saving
employeeSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Method to compare passwords
employeeSchema.methods.comparePassword = function (password) {
    return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('Employee', employeeSchema);
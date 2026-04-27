const mongoose = require('mongoose');

const OnboardingSchema = new mongoose.Schema(
    {
        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
            required: true,
            index: true
        },

        initiatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
            required: true
        },

        type: {
            type: String,
            enum: ['onboarding', 'offboarding'],
            required: true
        },

        notes: {
            type: String,
            trim: true
        },

        status: {
            type: String,
            enum: ['pending', 'completed', 'cancelled'],
            default: 'completed'
        },

        effectiveDate: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Onboarding', OnboardingSchema);
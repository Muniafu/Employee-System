const mongoose = require('mongoose');

const complianceSchema = new mongoose.Schema({
    actor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
    },

    action: { type: String, required: true },
    target: { type: String },

    ipAddress: String,
}, { timestamps: true });

complianceSchema.index({ actor: 1, action: 1, createdAt: -1 });

module.exports = mongoose.model('Compliance', complianceSchema);
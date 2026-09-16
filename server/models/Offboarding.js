const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: {
    type: String,
    enum: [
      'exit_interview', 'asset_return', 'access_revocation',
      'knowledge_transfer', 'leave_clearance', 'payroll',
      'clearance', 'documentation', 'other',
    ],
    default: 'other',
  },
  assignedTo: {
    type: String,
    enum: ['employee', 'hr', 'it', 'manager', 'finance'],
    default: 'hr',
  },
  dependsOn: [{ type: String }], // category names that must be fully complete first
  required: { type: Boolean, default: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const offboardingSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, unique: true },

  type: {
    type: String,
    enum: ['resignation', 'termination', 'retirement', 'contract_end', 'other'],
    default: 'resignation',
  },

  reason: { type: String, default: '' },
  lastWorkingDay: { type: Date, required: true },
  initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  tasks: [taskSchema],

  phase: {
    type: String,
    enum: ['initiated', 'in_progress', 'pending_approval', 'completed'],
    default: 'initiated',
  },

  progress: { type: Number, min: 0, max: 100, default: 0 },

  accessRevoked: { type: Boolean, default: false },
  accessRevokedAt: Date,
  accessRevokedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
}, { timestamps: true });

offboardingSchema.methods.calculateProgress = function () {
  const requiredTasks = this.tasks.filter(t => t.required);
  if (!requiredTasks.length) return 100;
  const done = requiredTasks.filter(t => t.completed).length;
  return Math.round((done / requiredTasks.length) * 100);
};

module.exports = mongoose.model('Offboarding', offboardingSchema);
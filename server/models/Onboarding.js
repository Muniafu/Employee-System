const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  category:    { type: String, enum: ['documentation', 'it_setup', 'training', 'meeting', 'policy', 'other'], default: 'other' },
  assignedTo:  { type: String, enum: ['employee', 'hr', 'it', 'manager'], default: 'employee' },
  dueDate:     { type: Date },
  completed:   { type: Boolean, default: false },
  completedAt: { type: Date },
  required:    { type: Boolean, default: true },
});

const onboardingSchema = new mongoose.Schema({
  employee:    { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, unique: true },
  startDate:   { type: Date, required: true },
  tasks:       [taskSchema],
  phase:       { type: String, enum: ['pre_boarding', 'first_day', 'first_week', 'first_month', 'completed'], default: 'pre_boarding' },
  progress:    { type: Number, min: 0, max: 100, default: 0 },
  buddy:       { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  hrContact:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes:       { type: String, default: '' },
  completedAt: { type: Date },
}, { timestamps: true });

onboardingSchema.methods.calculateProgress = function () {
  if (!this.tasks.length) return 0;
  const done = this.tasks.filter(t => t.completed).length;
  return Math.round((done / this.tasks.length) * 100);
};

module.exports = mongoose.model('Onboarding', onboardingSchema);
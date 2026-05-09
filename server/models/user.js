const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName:  { type: String, required: true, trim: true },
  lastName:   { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:   { type: String, required: true, minlength: 6, select: false },
  role:       { type: String, enum: ['employee', 'manager', 'hr', 'admin', 'superuser'], default: 'employee' },
  isActive:   { type: Boolean, default: true },
  lastLogin:  { type: Date },
  passwordChangedAt: { type: Date },
}, { timestamps: true });

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.changedPasswordAfter = function (jwtTimestamp) {
  if (this.passwordChangedAt) {
    return parseInt(this.passwordChangedAt.getTime() / 1000) > jwtTimestamp;
  }
  return false;
};

module.exports = mongoose.model('User', userSchema);
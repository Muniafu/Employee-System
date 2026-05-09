const User = require('../models/User');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Policy = require('../models/Policy');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const Attendance = require('../models/Attendance');

// GET /api/admin/dashboard-summary
exports.summary = async (req, res, next) => {
  try {
    const [totalUsers, activeEmployees, pendingLeaves, departments, recentPayrolls] = await Promise.all([
      User.countDocuments(),
      Employee.countDocuments({ status: 'active' }),
      Leave.countDocuments({ status: 'pending' }),
      Department.countDocuments({ isActive: true }),
      Payroll.find().sort({ createdAt: -1 }).limit(5)
        .populate({ path: 'employee', populate: { path: 'user', select: 'firstName lastName' } }),
    ]);

    const roleBreakdown = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      data: { totalUsers, activeEmployees, pendingLeaves, departments, roleBreakdown, recentPayrolls },
    });
  } catch (err) { next(err); }
};

// GET /api/admin/users — all users with employee info
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, isActive, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];

    const users = await User.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (err) { next(err); }
};

// PATCH /api/admin/users/:id/role
exports.changeRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const allowed = ['employee', 'manager', 'hr', 'admin', 'superuser'];
    if (!allowed.includes(role)) return res.status(400).json({ success: false, message: 'Invalid role.' });

    // Only superuser can assign superuser
    if (role === 'superuser' && req.user.role !== 'superuser') {
      return res.status(403).json({ success: false, message: 'Only superusers can assign superuser role.' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.status(200).json({ success: true, data: user });
  } catch (err) { next(err); }
};

// PATCH /api/admin/users/:id/toggle-active
exports.toggleActive = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    if (!user.isActive) {
      await Employee.findOneAndUpdate({ user: user._id }, { status: 'terminated' });
    } else {
      await Employee.findOneAndUpdate({ user: user._id }, { status: 'active' });
    }

    res.status(200).json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}.`, data: user });
  } catch (err) { next(err); }
};

// --- DEPARTMENTS ---
exports.getDepartments = async (req, res, next) => {
  try {
    const depts = await Department.find().populate('head', 'firstName lastName email');
    res.status(200).json({ success: true, count: depts.length, data: depts });
  } catch (err) { next(err); }
};

exports.createDepartment = async (req, res, next) => {
  try {
    const dept = await Department.create(req.body);
    res.status(201).json({ success: true, data: dept });
  } catch (err) { next(err); }
};

exports.updateDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found.' });
    res.status(200).json({ success: true, data: dept });
  } catch (err) { next(err); }
};

// --- POLICIES ---
exports.getPolicies = async (req, res, next) => {
  try {
    const policies = await Policy.find({ isActive: true }).populate('createdBy', 'firstName lastName').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: policies.length, data: policies });
  } catch (err) { next(err); }
};

exports.createPolicy = async (req, res, next) => {
  try {
    const policy = await Policy.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: policy });
  } catch (err) { next(err); }
};

// GET /api/admin/audit — payroll + leave audit trail
exports.auditLog = async (req, res, next) => {
  try {
    const { type } = req.query;
    const result = {};

    if (!type || type === 'payroll') {
      result.payroll = await Payroll.find({ status: 'finalized' })
        .populate({ path: 'employee', populate: { path: 'user', select: 'firstName lastName email' } })
        .populate('finalizedBy', 'firstName lastName')
        .sort({ finalizedAt: -1 })
        .limit(50);
    }

    if (!type || type === 'leave') {
      result.leave = await Leave.find({ status: { $in: ['approved', 'rejected'] } })
        .populate({ path: 'employee', populate: { path: 'user', select: 'firstName lastName' } })
        .populate('approvedBy', 'firstName lastName')
        .sort({ approvedAt: -1 })
        .limit(50);
    }

    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
};
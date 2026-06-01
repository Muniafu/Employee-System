const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const { createNotification } = require('../utils/notificationService');
const { sendEmail, templates } = require('../utils/emailService');
const User = require('../models/User');
const { getIO } = require( '../socket/socketManager' );

// POST /api/leave
exports.apply = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found.' });

    const { leaveType, startDate, endDate, reason } = req.body;

    // BUG PREVENTION: endDate >= startDate
    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ success: false, message: 'End date cannot be before start date.' });
    }

    // Overlap check
    const overlap = await Leave.findOne({
      employee: employee._id,
      status: { $in: ['pending', 'approved'] },
      $or: [{ startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) } }],
    });
    if (overlap) return res.status(409).json({ success: false, message: 'Overlapping leave already exists for this period.' });

    // Balance check
    const totalDays = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
    const balance = employee.leaveBalance[leaveType] ?? null;
    if (balance !== null && leaveType !== 'unpaid' && leaveType !== 'other' && totalDays > balance) {
      return res.status(400).json({ success: false, message: `Insufficient leave balance. Available: ${balance} days, Requested: ${totalDays} days.` });
    }

    const leave = await Leave.create({ employee: employee._id, leaveType, startDate, endDate, reason: reason || '' });
    await leave.populate({ path: 'employee', populate: { path: 'user', select: 'firstName lastName email' } });

    // Notify admins
    const admins = await User.find({ role: { $in: ['admin', 'hr'] } });
    for (const admin of admins) {
      await createNotification({ recipient: admin._id, type: 'leave', title: 'New Leave Request', message: `${req.user.firstName} ${req.user.lastName} submitted a ${leaveType} leave request.`, priority: 'high' });
    }

    res.status(201).json({ success: true, data: leave });
  } catch (err) { next(err); }
};

// GET /api/leave
exports.getAll = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'employee') {
      const emp = await Employee.findOne({ user: req.user._id });
      if (!emp) return res.status(404).json({ success: false, message: 'Employee not found.' });
      filter.employee = emp._id;
    }
    if (req.query.status) filter.status = req.query.status;
    if (req.query.leaveType) filter.leaveType = req.query.leaveType;

    const leaves = await Leave.find(filter)
      .populate({ path: 'employee', select: 'department position', populate: { path: 'user', select: 'firstName lastName email' } })
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: leaves.length, data: leaves });
  } catch (err) { next(err); }
};

// GET /api/leave/on-leave
exports.getOnLeave = async (req, res, next) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const records = await Leave.find({ status: 'approved', startDate: { $lte: today }, endDate: { $gte: today } })
      .populate({ path: 'employee', populate: { path: 'user', select: 'firstName lastName email' } });
    res.status(200).json({ success: true, count: records.length, data: records });
  } catch (err) { next(err); }
};

// PATCH /api/leave/:id/approve
exports.approve = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate({ path: 'employee', populate: { path: 'user', select: 'firstName lastName email' } });
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found.' });
    if (leave.status !== 'pending') return res.status(400).json({ success: false, message: `Cannot approve a ${leave.status} leave.` });

    leave.status = 'approved';
    leave.approvedBy = req.user._id;
    leave.approvedAt = new Date();
    leave.adminNote = req.body.adminNote || '';
    await leave.save();
    try {

      getIO().emit(
      'leave:approved',
      {
      employee:
      leave.employee._id,
      }
      );

      } catch {}

    // Deduct balance
    const emp = await Employee.findById(leave.employee._id);
    if (emp && emp.leaveBalance[leave.leaveType] !== undefined) {
      emp.leaveBalance[leave.leaveType] = Math.max(0, emp.leaveBalance[leave.leaveType] - leave.totalDays);
      await emp.save();
    }

    // Notify employee
    await createNotification({ recipient: leave.employee.user._id, type: 'leave', title: 'Leave Approved ✅', message: `Your ${leave.leaveType} leave has been approved.`, priority: 'medium' });
    getIO().emit('leave:approved', { employee: leave.employee.user._id });
    sendEmail({ to: leave.employee.user.email, ...templates.leaveApproved(leave.employee.user.firstName, { start: leave.startDate, end: leave.endDate }) }).catch(() => {});

    res.status(200).json({ success: true, data: leave });
  } catch (err) { next(err); }
};

// PATCH /api/leave/:id/reject
exports.reject = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate({ path: 'employee', populate: { path: 'user', select: 'firstName lastName email' } });
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found.' });
    if (leave.status !== 'pending') return res.status(400).json({ success: false, message: `Cannot reject a ${leave.status} leave.` });

    leave.status = 'rejected';
    leave.approvedBy = req.user._id;
    leave.approvedAt = new Date();
    leave.adminNote = req.body.adminNote || '';
    await leave.save();
    try {

      getIO().emit(
      'leave:approved',
      {
      employee:
      leave.employee._id,
      }
      );

      } catch {}

    await createNotification({ recipient: leave.employee.user._id, type: 'leave', title: 'Leave Request Update', message: `Your ${leave.leaveType} leave was not approved. Check admin note.`, priority: 'medium' });
    sendEmail({ to: leave.employee.user.email, ...templates.leaveRejected(leave.employee.user.firstName, leave.adminNote) }).catch(() => {});

    res.status(200).json({ success: true, data: leave });
  } catch (err) { next(err); }
};

// PATCH /api/leave/:id/cancel
exports.cancel = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id).populate('employee');
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found.' });
    const isOwner = leave.employee.user.toString() === req.user._id.toString();
    if (!isOwner && !['admin', 'hr', 'superuser'].includes(req.user.role)) return res.status(403).json({ success: false, message: 'Access denied.' });
    if (leave.status !== 'pending') return res.status(400).json({ success: false, message: 'Only pending leaves can be cancelled.' });
    leave.status = 'cancelled';
    await leave.save();
    try {

      getIO().emit(
      'leave:approved',
      {
      employee:
      leave.employee._id,
      }
      );

      } catch {}
    res.status(200).json({ success: true, data: leave });
  } catch (err) { next(err); }
};
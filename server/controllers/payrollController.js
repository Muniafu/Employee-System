const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const { buildPayrollPreview } = require('../utils/payrollHelper');
const { createNotification } = require('../utils/notificationService');
const { sendEmail, templates } = require('../utils/emailService');

const getCurrentPeriod = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

// POST /api/payroll/preview — admin calculates payroll for employee
exports.preview = async (req, res, next) => {
  try {
    const { employeeId, period } = req.body;
    const targetPeriod = period || getCurrentPeriod();

    const employee = await Employee.findById(employeeId).populate('user', 'firstName lastName email');
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });

    // Get attendance for period
    const attendanceRecords = await Attendance.find({
      employee: employee._id,
      date: { $regex: `^${targetPeriod}` },
      status: 'present',
    });

    const daysWorked = attendanceRecords.length;
    const overtimeHours = parseFloat(attendanceRecords.reduce((s, r) => s + r.overtime, 0).toFixed(2));

    const preview = buildPayrollPreview(employee, daysWorked, overtimeHours);

    res.status(200).json({
      success: true,
      data: {
        employee: { id: employee._id, name: `${employee.user.firstName} ${employee.user.lastName}`, position: employee.position, department: employee.department },
        period: targetPeriod,
        ...preview,
        currency: employee.currency || 'KES',
      },
    });
  } catch (err) { next(err); }
};

// POST /api/payroll/finalize — BUG PREVENTION: Cannot finalize twice
exports.finalize = async (req, res, next) => {
  try {
    const { employeeId, period, allowances, deductions, notes } = req.body;
    const targetPeriod = period || getCurrentPeriod();

    const employee = await Employee.findById(employeeId).populate('user', 'firstName lastName email');
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });

    // CRITICAL: immutability check
    const existing = await Payroll.findOne({ employee: employeeId, period: targetPeriod });
    if (existing && existing.status !== 'draft') {
      return res.status(409).json({ success: false, message: `Payroll already ${existing.status} for ${targetPeriod}. Cannot finalize again.` });
    }

    const attendanceRecords = await Attendance.find({ employee: employee._id, date: { $regex: `^${targetPeriod}` }, status: 'present' });
    const daysWorked = attendanceRecords.length;
    const overtimeHours = parseFloat(attendanceRecords.reduce((s, r) => s + r.overtime, 0).toFixed(2));
    const preview = buildPayrollPreview(employee, daysWorked, overtimeHours);

    const payrollData = {
      employee: employeeId,
      period: targetPeriod,
      basicSalary: preview.basicSalary,
      allowances: allowances || { housing: 0, transport: 0, medical: 0, other: 0 },
      deductions: deductions || preview.deductions,
      daysWorked,
      overtimeHours,
      overtimePay: preview.overtimePay,
      status: 'finalized',
      finalizedBy: req.user._id,
      finalizedAt: new Date(),
      notes: notes || '',
    };

    let payroll;
    if (existing) {
      // Update draft
      Object.assign(existing, payrollData);
      payroll = await existing.save();
    } else {
      payroll = await Payroll.create(payrollData);
    }

    await payroll.populate({ path: 'employee', populate: { path: 'user', select: 'firstName lastName email' } });

    // Notify employee
    await createNotification({ recipient: employee.user._id, type: 'payroll', title: 'Payslip Ready 💰', message: `Your payslip for ${targetPeriod} is ready. Net pay: ${employee.currency || 'KES'} ${payroll.netPay?.toLocaleString()}.`, priority: 'medium' });
    sendEmail({ to: employee.user.email, ...templates.payrollFinalized(employee.user.firstName, targetPeriod, `${employee.currency || 'KES'} ${payroll.netPay?.toLocaleString()}`) }).catch(() => {});

    res.status(200).json({ success: true, data: payroll });
  } catch (err) { next(err); }
};

// GET /api/payroll/me
exports.getMyPayroll = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });

    const payrolls = await Payroll.find({ employee: employee._id }).sort({ period: -1 });
    res.status(200).json({ success: true, count: payrolls.length, data: payrolls });
  } catch (err) { next(err); }
};

// GET /api/payroll/all — admin
exports.getAll = async (req, res, next) => {
  try {
    const { period, status, department } = req.query;
    const filter = {};
    if (period) filter.period = period;
    if (status) filter.status = status;

    if (department) {
      const emps = await Employee.find({ department: { $regex: department, $options: 'i' } });
      filter.employee = { $in: emps.map(e => e._id) };
    }

    const payrolls = await Payroll.find(filter)
      .populate({ path: 'employee', select: 'department position', populate: { path: 'user', select: 'firstName lastName email' } })
      .populate('finalizedBy', 'firstName lastName')
      .sort({ period: -1, createdAt: -1 });

    res.status(200).json({ success: true, count: payrolls.length, data: payrolls });
  } catch (err) { next(err); }
};

// GET /api/payroll/:id
exports.getOne = async (req, res, next) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate({ path: 'employee', populate: { path: 'user', select: 'firstName lastName email' } });
    if (!payroll) return res.status(404).json({ success: false, message: 'Payroll record not found.' });
    res.status(200).json({ success: true, data: payroll });
  } catch (err) { next(err); }
};
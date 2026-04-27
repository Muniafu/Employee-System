const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");
const Notification = require("../models/Notification");
const Payroll = require("../models/Payroll");
const Leave = require("../models/Leave");
const { getPeriodRange, daysInMonth } = require("../utils/payrollHelper");

// PREVIEW PAYROLL (DERIVED, NOT SAVED)
exports.previewPayroll = async (req, res, next) => {
  try {
    const { employeeId, month, year } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee || employee.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Employee not found or inactive'
      });
    }

    const existing = await Payroll.findOne({
      employee: employeeId,
      'period.month': month,
      'period.year': year
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Payroll already exists for this period'
      });
    }

    const { start, end } = getPeriodRange(month, year);

    // Attendance within month
    const attendance = await Attendance.find({
      employee: employeeId,
      date: { $gte: start, $lte: end },
      clockOut: { $ne: null }
    });

    const workedDays = attendance.length;

    // Approved Leave within month
    const approvedLeave = await Leave.find({
      employee: employeeId,
      status: 'approved',
      startDate: { $lte: end },
      endDate: { $gte: start }
    });

    const leaveDays = approvedLeave.reduce((sum, l) => {
      const from = l.startDate < start ? start : l.startDate;
      const to = l.endDate > end ? end : l.endDate;
      return sum + Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;
    }, 0);

    const totalDays = daysInMonth(month, year);
    const payableDays = Math.min(workedDays + leaveDays, totalDays);

    const dailyRate = employee.salary / totalDays;
    const grossPay = dailyRate * payableDays;

    const deductions = 0;
    const allowances = 0;

    const netPay = grossPay + allowances - deductions;

    res.json({
      success: true,
      data: {
        employee: employee._id,
        period: { month, year },
        baseSalary: employee.salary,
        workedDays,
        leaveDays,
        payableDays,
        netPay
      }
    });

  } catch (err) {
    next(err);
  }
};

// FINALIZE PAYROLL (SAVE TO DB/IMMUTABEL)
exports.finalizePayroll = async (req, res, next) => {
  try {
    const { employeeId, month, year } = req.body;

    const existing = await Payroll.findOne({
      employee: employeeId,
      'period.month': month,
      'period.year': year
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Payroll already finalized'
      });
    }

    const preview = await exports.previewPayroll(
      req,
      { json: (data) => data },
      next
    );

    const payroll = await Payroll.create({
      employee: employeeId,
      period: { month, year },
      baseSalary: preview.data.baseSalary,
      deductions: 0,
      allowances: 0,
      netpay: preview.data.netPay,
      generatedBy: req.user._id,
      finalized: true
    });

    await Notification.create({
      user: employeeId,
      type: 'payroll',
      message: `Payroll for ${month}/${year} finalized`
    });

    res.status(201).json({
      success: true,
      data: payroll
    });

  } catch (err) {
    next(err);
  }
};

// Employee Payroll History View
exports.getMyPayrolls = async (req, res, next) => {
    try {
        const payrolls = await Payroll.find({ employee: req.user._id }).sort({ 'period.year': -1, 'period.month': -1 });

        res.json({
            success: true,
            data: payrolls
        });
    } catch (err) {
        next(err);
    }
};

// Admin/ Employer: View 
exports.getAllPayrolls = async (req, res, next) => {
    try {
        const payrolls = await Payroll.find().populate('employee', 'name email').sort({ createdAt: -1 });

        res.json({
            success: true,
            data: payrolls
        });
    } catch (err) {
        next(err);
    }
};
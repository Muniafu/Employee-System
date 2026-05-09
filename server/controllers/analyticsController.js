const { getPeriod, getHeadcountStats, getAttendanceStats, getPayrollStats, getLeaveStats, getEngagementScore } = require('../utils/analyticsHelper');

// GET /api/analytics/dashboard
exports.dashboard = async (req, res, next) => {
  try {
    const period = req.query.period || getPeriod();
    const [headcount, attendance, payroll, leave, engagement] = await Promise.all([
      getHeadcountStats(),
      getAttendanceStats(period),
      getPayrollStats(period),
      getLeaveStats(period),
      getEngagementScore(),
    ]);

    res.status(200).json({
      success: true,
      period,
      data: { headcount, attendance, payroll, leave, engagement },
      generatedAt: new Date(),
    });
  } catch (err) { next(err); }
};

// GET /api/analytics/attendance
exports.attendance = async (req, res, next) => {
  try {
    const period = req.query.period || getPeriod();
    const data = await getAttendanceStats(period);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

// GET /api/analytics/payroll
exports.payroll = async (req, res, next) => {
  try {
    const period = req.query.period || getPeriod();
    const data = await getPayrollStats(period);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

// GET /api/analytics/headcount
exports.headcount = async (req, res, next) => {
  try {
    const data = await getHeadcountStats();
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

// GET /api/analytics/leave
exports.leave = async (req, res, next) => {
  try {
    const period = req.query.period || getPeriod();
    const data = await getLeaveStats(period);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

// GET /api/analytics/turnover
exports.turnover = async (req, res, next) => {
  try {
    const Employee = require('../models/Employee');
    const total = await Employee.countDocuments();
    const terminated = await Employee.countDocuments({ status: 'terminated' });
    const rate = total > 0 ? ((terminated / total) * 100).toFixed(1) : 0;

    const byDept = await Employee.aggregate([
      { $match: { status: 'terminated' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({ success: true, data: { total, terminated, turnoverRate: `${rate}%`, byDepartment: byDept } });
  } catch (err) { next(err); }
};
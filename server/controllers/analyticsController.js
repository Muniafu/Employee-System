const {
  getDashboardStats,
  getAttendanceStats,
  getPayrollStats
} = require('../utils/analyticsHelper');

// =========================
// Dashboard
// =========================
exports.dashboard = async (req, res, next) => {
  try {
    const data = await getDashboardStats(req.user.organizationId);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// =========================
// Attendance Analytics
// =========================
exports.attendance = async (req, res, next) => {
  try {
    const data = await getAttendanceStats(req.user.organizationId);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// =========================
// Payroll Analytics
// =========================
exports.payroll = async (req, res, next) => {
  try {
    const data = await getPayrollStats(req.user.organizationId);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Payroll = require('../models/Payroll');

// ==============================
// DASHBOARD STATS
// ==============================
exports.getDashboardStats = async (orgId) => {
  const totalEmployees = await Employee.countDocuments({
    organizationId: orgId,
    status: 'active'
  });

  const attendanceRecords = await Attendance.find({
    organizationId: orgId
  });

  const totalDays = attendanceRecords.length;
  const completedDays = attendanceRecords.filter(a => a.clockOut).length;

  const attendanceRate = totalDays
    ? ((completedDays / totalDays) * 100).toFixed(2)
    : 0;

  return {
    totalEmployees,
    attendanceRate
  };
};

// ==============================
// ATTENDANCE STATS
// ==============================
exports.getAttendanceStats = async (orgId) => {
  const stats = await Attendance.aggregate([
    { $match: { organizationId: orgId } },
    {
      $group: {
        _id: null,
        totalRecords: { $sum: 1 },
        avgHours: { $avg: '$totalHours' }
      }
    }
  ]);

  return stats[0] || { totalRecords: 0, avgHours: 0 };
};

// ==============================
// PAYROLL STATS
// ==============================
exports.getPayrollStats = async (orgId) => {
  const stats = await Payroll.aggregate([
    { $match: { organizationId: orgId, finalized: true } },
    {
      $group: {
        _id: null,
        totalPayroll: { $sum: '$netpay' },
        avgSalary: { $avg: '$netpay' }
      }
    }
  ]);

  return stats[0] || { totalPayroll: 0, avgSalary: 0 };
};
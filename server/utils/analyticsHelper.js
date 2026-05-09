const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const Performance = require('../models/Performance');

const getPeriod = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getHeadcountStats = async () => {
  const [total, active, onLeave, terminated] = await Promise.all([
    Employee.countDocuments(),
    Employee.countDocuments({ status: 'active' }),
    Employee.countDocuments({ status: 'on_leave' }),
    Employee.countDocuments({ status: 'terminated' }),
  ]);

  const byDept = await Employee.aggregate([
    { $group: { _id: '$department', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  return { total, active, onLeave, terminated, byDepartment: byDept };
};

const getAttendanceStats = async (period) => {
  const [year, month] = period.split('-').map(Number);
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

  const stats = await Attendance.aggregate([
    { $match: { date: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgHours: { $avg: '$hoursWorked' },
      },
    },
  ]);

  const totalRecords = await Attendance.countDocuments({ date: { $gte: startDate, $lte: endDate } });
  const lateCount = await Attendance.countDocuments({ date: { $gte: startDate, $lte: endDate }, isLate: true });
  const avgHours = await Attendance.aggregate([
    { $match: { date: { $gte: startDate, $lte: endDate }, status: 'present' } },
    { $group: { _id: null, avg: { $avg: '$hoursWorked' } } },
  ]);

  return { period, breakdown: stats, totalRecords, lateCount, avgHoursWorked: avgHours[0]?.avg?.toFixed(2) || 0 };
};

const getPayrollStats = async (period) => {
  const stats = await Payroll.aggregate([
    { $match: { period } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalGross: { $sum: '$grossPay' },
        totalNet: { $sum: '$netPay' },
        totalPaye: { $sum: '$deductions.paye' },
        avgNet: { $avg: '$netPay' },
      },
    },
  ]);
  return { period, breakdown: stats };
};

const getLeaveStats = async (period) => {
  const [year, month] = period.split('-').map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);

  const stats = await Leave.aggregate([
    { $match: { startDate: { $gte: start, $lte: end } } },
    { $group: { _id: { type: '$leaveType', status: '$status' }, count: { $sum: 1 }, totalDays: { $sum: '$totalDays' } } },
  ]);

  return { period, breakdown: stats };
};

const getEngagementScore = async () => {
  const Engagement = require('../models/Engagement');
  const surveys = await Engagement.find({ isActive: true });
  let totalNps = 0, count = 0;
  surveys.forEach(s => {
    if (s.avgNps > 0) { totalNps += s.avgNps; count++; }
  });
  return { avgNps: count ? (totalNps / count).toFixed(1) : 0, totalSurveys: surveys.length };
};

module.exports = { getPeriod, getHeadcountStats, getAttendanceStats, getPayrollStats, getLeaveStats, getEngagementScore };
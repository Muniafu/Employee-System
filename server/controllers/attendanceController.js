const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

// Kenya timezone-safe date
const getTodayStr = () => {
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
};

const getEmployeeOrFail = async (userId) => {

  const employee = await Employee.findOne({
    user: userId,
  });

  if (!employee) {

    const err = new Error(
      'Employee profile missing or corrupted. Contact administrator.'
    );

    err.statusCode = 422;

    throw err;
  }

  return employee;
};

// POST /api/attendance/clock-in
exports.clockIn = async (req, res, next) => {
  try {
    const employee = await getEmployeeOrFail(req.user._id, res);
    if (!employee) return;

    const today = getTodayStr();

    const existing = await Attendance.findOne({
      employee: employee._id,
      date: today,
    });

    if (existing?.clockIn) {
      return res.status(409).json({
        success: false,
        message: 'Already clocked in today.',
      });
    }

    const now = new Date();

    const workStart = new Date(now);
    workStart.setHours(8, 0, 0, 0);

    const isLate = now > workStart;

    const attendance = await Attendance.create({
      employee: employee._id,
      date: today,
      clockIn: now,
      status: 'present',
      isLate,
      location: req.body.location || 'office',
      note: req.body.note || '',
    });

    res.status(201).json({
      success: true,
      message: isLate
        ? 'Clocked in successfully (Late)'
        : 'Clocked in successfully',
      data: attendance,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/attendance/clock-out
exports.clockOut = async (req, res, next) => {
  try {
    const employee = await getEmployeeOrFail(req.user._id, res);
    if (!employee) return;

    const today = getTodayStr();

    const attendance = await Attendance.findOne({
      employee: employee._id,
      date: today,
    });

    if (!attendance || !attendance.clockIn) {
      return res.status(400).json({
        success: false,
        message: 'Clock in first before clocking out.',
      });
    }

    if (attendance.clockOut) {
      return res.status(409).json({
        success: false,
        message: 'Already clocked out today.',
      });
    }

    attendance.clockOut = new Date();

    attendance.calculateHours();

    if (req.body.note) {
      attendance.note = req.body.note;
    }

    await attendance.save();

    res.status(200).json({
      success: true,
      message: `Clocked out successfully. Total hours: ${attendance.hoursWorked}`,
      data: attendance,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/attendance/me
exports.getMyAttendance = async (req, res, next) => {
  try {
    const employee = await getEmployeeOrFail(req.user._id, res);
    if (!employee) return;

    const now = new Date();

    const year = Number(req.query.year) || now.getFullYear();
    const month = Number(req.query.month) || now.getMonth() + 1;

    const prefix = `${year}-${String(month).padStart(2, '0')}`;

    const records = await Attendance.find({
      employee: employee._id,
      date: { $regex: `^${prefix}` },
    }).sort({ date: -1 });

    const summary = {
      present: records.filter((r) => r.status === 'present').length,
      absent: records.filter((r) => r.status === 'absent').length,
      late: records.filter((r) => r.isLate).length,
      totalHours: parseFloat(
        records.reduce((sum, r) => sum + r.hoursWorked, 0).toFixed(2)
      ),
      overtime: parseFloat(
        records.reduce((sum, r) => sum + r.overtime, 0).toFixed(2)
      ),
    };

    res.status(200).json({
      success: true,
      period: prefix,
      summary,
      count: records.length,
      data: records,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/attendance/today
exports.getToday = async (req, res, next) => {
  try {
    const employee = await getEmployeeOrFail(req.user._id, res);
    if (!employee) return;

    const record = await Attendance.findOne({
      employee: employee._id,
      date: getTodayStr(),
    });

    return res.status(200).json({
      success: true,
      data: record || null,
      message: record
        ? record.clockOut
          ? 'Workday completed.'
          : 'Currently clocked in.'
        : 'Not clocked in yet.',
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/attendance/all
exports.getAll = async (req, res, next) => {
  try {
    const { date, department } = req.query;

    const filter = {};

    if (date) {
      filter.date = date;
    }

    if (department) {
      const employees = await Employee.find({
        department: {
          $regex: department,
          $options: 'i',
        },
      });

      filter.employee = {
        $in: employees.map((e) => e._id),
      };
    }

    const records = await Attendance.find(filter)
      .populate({
        path: 'employee',
        select: 'department position',
        populate: {
          path: 'user',
          select: 'firstName lastName email',
        },
      })
      .sort({ date: -1 })
      .limit(200);

    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (err) {
    next(err);
  }
};
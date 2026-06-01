const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const Leave = require('../models/Leave');
const syncEmployeeLeaveStatus =
require(
'../utils/syncEmployeeLeaveStatus'
);
const {
getIO,
} =
require(
'../socket/socketManager'
);

// Kenya timezone-safe date
const getTodayStr = () => {
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
};

const getKenyaDate = () => {
  const now = new Date();

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Nairobi',
  }).format(now);
};

const isEmployeeOnApprovedLeave =
async (
employeeId
) => {

const today =
getKenyaDate();

const leave =
await Leave.findOne({
employee:
employeeId,

status:
'approved',
})
.lean();

if (!leave) {
return null;
}

const start =
new Date(
leave.startDate
)
.toLocaleDateString(
'en-CA',
{
timeZone:
'Africa/Nairobi',
}
);

const end =
new Date(
leave.endDate
)
.toLocaleDateString(
'en-CA',
{
timeZone:
'Africa/Nairobi',
}
);

if (
today >= start &&
today <= end
) {
return leave;
}

return null;

};

// POST /api/attendance/clock-in
exports.clockIn = async (req, res, next) => {
  try {
    const employee = req.employee;

    await syncEmployeeLeaveStatus(
      employee._id
    );

    const activeLeave =
      await isEmployeeOnApprovedLeave(
      employee._id
    );

    if (activeLeave) {
      await Attendance.updateOne(
        {
          employee: employee._id,
          date: getKenyaDate(),
        },
        {
          $setOnInsert: {
            employee: employee._id,
            date: getKenyaDate(),
            status: 'on_leave',
          },
        },
        {
          upsert: true,
        }
      );

      try {

        getIO().emit(
        'attendance:update',
        {
        employee:
        employee._id,
        }
        );

        } catch {}

      return res.status(403).json({
        success: false,
        code: 'EMPLOYEE_ON_LEAVE',
        message:
          'Clock in unavailable during approved leave.',
      });
    }

    const today = getKenyaDate();

    const existing =
      await Attendance.findOne({
        employee: employee._id,
        date: today,
      });

    if (existing?.clockIn) {
      return res.status(409).json({
        success: false,
        message:
          'Attendance already recorded.',
      });
    }

    const now = new Date();

    const workStart =
      new Date(now);

    workStart.setHours(
      8,
      0,
      0,
      0
    );

    const attendance =
      await Attendance.findOneAndUpdate(
        {
          employee: employee._id,
          date: today,
        },
        {
          $setOnInsert: {
            employee: employee._id,
            date: today,
            clockIn: now,
            status: 'present',
            isLate: now > workStart,
            location:
              req.body.location ||
              'office',
            note:
              req.body.note || '',
          },
        },
        {
          upsert: true,
          new: true,
        }
      );

    return res.status(201).json({
      success: true,
      data: attendance,
    });

  } catch (err) {
    next(err);
  }
};

// POST /api/attendance/clock-out
exports.clockOut = async (req, res, next) => {
  try {
    const employee = req.employee;

    const activeLeave =
      await isEmployeeOnApprovedLeave(
        employee._id
      );

      await syncEmployeeLeaveStatus(
        employee._id
      );

    if (activeLeave) {
      return res.status(403).json({
        success: false,
        message:
          'Clock out disabled during approved leave.',
      });
    }

    const today = getKenyaDate();

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

    try {

      getIO().emit(
      'attendance:update',
      {
      employee:
      employee._id,
      }
      );

      } catch {}

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
    const employee = req.employee;

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
    const employee = req.employee;

    const leave =
      await isEmployeeOnApprovedLeave(
        employee._id
      );

      await syncEmployeeLeaveStatus(
        employee._id
      );

    if (leave) {
      return res.status(200).json({
        success: true,
        onLeave: true,
        leave,
        data: {
          status:
          'on_leave',
        },
        message:
          'Employee currently on approved leave.',
      });
    }

    const record = await Attendance.findOne({
      employee: employee._id,
      date: getKenyaDate(),
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
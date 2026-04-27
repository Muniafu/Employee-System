const Attendance = require('../models/Attendance');
const Payroll = require('../models/Payroll');

const normalizeDate = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

// Clock In
exports.clockIn = async (req, res, next) => {
    try {
        const employeeId = req.user._id;
        const today = normalizeDate(new Date());

        // Prevent clock-in if payroll already generated for today (edge safety)
        const payrollExists = await Payroll.findOne({
            employee: employeeId,
            'period.month': today.getMonth() + 1,
            'period.year': today.getFullYear(),
            finalized: true
        });

        if (payrollExists) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot clock in after payroll generation' 
            });
        }

        const existing = await Attendance.findOne({
            employee: employeeId,
            date: today
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Already clocked in for today'
            });
        }

        const attendance = await Attendance.create({
            employee: employeeId,
            date: today,
            clockIn: new Date()
        });

        res.status(201).json({
            success: true,
            data: attendance
        });
    } catch (err) {
        next(err);
    }
};

// Clock Out
exports.clockOut = async (req, res, next) => {
    try {
        const employeeId = req.user._id;
        const today = normalizeDate(new Date());

        const attendance = await Attendance.findOne({
            employee: employeeId,
            date: today
        });

        if (!attendance) {
            return res.status(400).json({
                success: false,
                message: 'No clock-in record found for today'
            });
        }

        if (attendance.clockOut) {
            return res.status(400).json({
                success: false,
                message: 'Already clocked out for today'
            });
        }

        attendance.clockOut = new Date();
        await attendance.save();

        res.json({
            success: true,
            data: attendance
        });
    } catch (err) {
        next(err);
    }
};

// Get Own Attendance Records (Employee View)
exports.getMyAttendance = async (req, res, next) => {
    try {
        const records = await Attendance.find({ employee: req.user._id }).sort({ date: -1 });

        res.json({
            success: true,
            data: records
        });
    } catch (err) {
        next(err);
    }
};

// Get Attendance Records(Employer/Admin)
exports.getAllAttendance = async (req, res, next) => {
    try {
        const records = await Attendance.find().populate('employee', 'name email department').sort({ date: -1 });

        res.json({
            success: true,
            data: records
        });
    } catch (err) {
        next(err);
    }
};

// Get specific employee attendance
exports.getByEmployee = async (req, res, next) => {
    try {
        const records = await Attendance.find({ employee: req.params.employeeId }).sort({ date: -1 });

        res.json({
            success: true,
            data: records
        });
    } catch (err) {
        next(err);
    }
};
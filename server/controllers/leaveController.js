const Leave = require('../models/Leave');
const Attendance = require('../models/Attendance');

// Helper: normalize date
const normalizeDate = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// ===============================
// Employee: Request Leave
// ===============================
exports.requestLeave = async (req, res, next) => {
  try {
    const { type, startDate, endDate } = req.body;

    const start = normalizeDate(startDate);
    const end = normalizeDate(endDate);

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Prevent overlapping leave
    const overlapping = await Leave.findOne({
      employee: req.user._id,
      status: { $in: ['pending', 'approved'] },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ]
    });

    if (overlapping) {
      return res.status(400).json({
        success: false,
        message: 'You already have overlapping leave'
      });
    }

    const leave = await Leave.create({
      employee: req.user._id,
      type,
      startDate: start,
      endDate: end
    });

    res.status(201).json({
      success: true,
      data: leave
    });

  } catch (err) {
    next(err);
  }
};

// ===============================
// Employee: Get My Leaves
// ===============================
exports.getMyLeaves = async (req, res, next) => {
  try {
    const leaves = await Leave
      .find({ employee: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: leaves
    });

  } catch (err) {
    next(err);
  }
};

// ===============================
// Admin/Employer: Get All Leaves
// ===============================
exports.getAllLeaves = async (req, res, next) => {
  try {
    const leaves = await Leave
      .find()
      .populate('employee', 'name email department')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: leaves
    });

  } catch (err) {
    next(err);
  }
};

// ===============================
// Approve Leave
// ===============================
exports.approveLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave)
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });

    leave.status = 'approved';
    leave.approvedBy = req.user._id;
    await leave.save();

    res.json({
      success: true,
      data: leave
    });

  } catch (err) {
    next(err);
  }
};

// ===============================
// Reject Leave
// ===============================
exports.rejectLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave)
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });

    leave.status = 'rejected';
    leave.approvedBy = req.user._id;
    await leave.save();

    res.json({
      success: true,
      data: leave
    });

  } catch (err) {
    next(err);
  }
};
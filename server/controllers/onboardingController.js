const Onboarding = require('../models/Onboarding');
const Employee = require('../models/Employee');

// GET ALL
exports.getAll = async (req, res, next) => {
  try {
    const records = await Onboarding.find()
      .populate('employee', 'name email')
      .populate('initiatedBy', 'name');

    res.json({
      success: true,
      data: records
    });
  } catch (err) {
    next(err);
  }
};

// GET BY EMPLOYEE
exports.getByEmployee = async (req, res, next) => {
  try {
    const records = await Onboarding.find({
      employee: req.params.employeeId
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: records
    });
  } catch (err) {
    next(err);
  }
};

// CREATE (Onboarding or Offboarding)
exports.create = async (req, res, next) => {
  try {
    const { employeeId, notes, type } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    if (type === 'offboarding' && employee.status === 'terminated') {
      return res.status(400).json({
        success: false,
        message: 'Employee already terminated'
      });
    }

    const record = await Onboarding.create({
      employee: employeeId,
      initiatedBy: req.user._id,
      notes,
      type
    });

    // Update employee status
    if (type === 'offboarding') {
      employee.status = 'terminated';
    }

    if (type === 'onboarding') {
      employee.status = 'active';
    }

    await employee.save();

    res.status(201).json({
      success: true,
      message: `${type} successful`,
      data: record
    });
  } catch (err) {
    next(err);
  }
};

// DELETE RECORD (optional admin cleanup)
exports.delete = async (req, res, next) => {
  try {
    const record = await Onboarding.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }

    await record.deleteOne();

    res.json({
      success: true,
      message: 'Record deleted'
    });
  } catch (err) {
    next(err);
  }
};
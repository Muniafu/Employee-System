const CareerPath = require('../models/CareerPath');

// ===========================
// Create Career Path (Admin)
// ===========================
exports.createPath = async (req, res, next) => {
  try {
    const path = await CareerPath.create({
      ...req.body,
      organizationId: req.user.organizationId
    });

    res.status(201).json({
      success: true,
      data: path
    });

  } catch (err) {
    next(err);
  }
};

// ===========================
// Get All Paths (Admin)
// ===========================
exports.getAllPaths = async (req, res, next) => {
  try {
    const paths = await CareerPath.find({
      organizationId: req.user.organizationId
    }).populate('employee', 'name email');

    res.json({
      success: true,
      data: paths
    });

  } catch (err) {
    next(err);
  }
};

// ===========================
// Get By Employee
// ===========================
exports.getByEmployee = async (req, res, next) => {
  try {
    const path = await CareerPath.findOne({
      organizationId: req.user.organizationId,
      employee: req.params.employeeId
    });

    res.json({
      success: true,
      data: path
    });

  } catch (err) {
    next(err);
  }
};

// ===========================
// Get My Path (Employee)
// ===========================
exports.getMyPath = async (req, res, next) => {
  try {
    const path = await CareerPath.findOne({
      organizationId: req.user.organizationId,
      employee: req.user._id
    });

    res.json({
      success: true,
      data: path
    });

  } catch (err) {
    next(err);
  }
};

// ===========================
// Update Path (Admin)
// ===========================
exports.updatePath = async (req, res, next) => {
  try {
    const path = await CareerPath.findOneAndUpdate(
      {
        _id: req.params.id,
        organizationId: req.user.organizationId
      },
      req.body,
      { new: true }
    );

    res.json({
      success: true,
      data: path
    });

  } catch (err) {
    next(err);
  }
};
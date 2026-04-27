const Learning = require('../models/Learning');

// ===========================
// Create Module (Admin)
// ===========================
exports.createModule = async (req, res, next) => {
  try {
    const module = await Learning.create({
      ...req.body,
      organizationId: req.user.organizationId
    });

    res.status(201).json({
      success: true,
      data: module
    });

  } catch (err) {
    next(err);
  }
};

// ===========================
// Get All Modules (Org)
// ===========================
exports.getAllModules = async (req, res, next) => {
  try {
    const modules = await Learning.find({
      organizationId: req.user.organizationId
    });

    res.json({
      success: true,
      data: modules
    });

  } catch (err) {
    next(err);
  }
};

// ===========================
// Enroll Employee
// ===========================
exports.enroll = async (req, res, next) => {
  try {
    const module = await Learning.findOne({
      _id: req.params.moduleId,
      organizationId: req.user.organizationId
    });

    if (!module)
      return res.status(404).json({ success: false, message: 'Module not found' });

    const alreadyEnrolled = module.enrollments.find(
      e => e.employee.toString() === req.user._id.toString()
    );

    if (alreadyEnrolled)
      return res.status(400).json({
        success: false,
        message: 'Already enrolled'
      });

    module.enrollments.push({
      employee: req.user._id
    });

    await module.save();

    res.json({
      success: true,
      message: 'Enrolled successfully'
    });

  } catch (err) {
    next(err);
  }
};

// ===========================
// Update Progress
// ===========================
exports.updateProgress = async (req, res, next) => {
  try {
    const { progress } = req.body;

    const module = await Learning.findOne({
      _id: req.params.moduleId,
      organizationId: req.user.organizationId
    });

    const enrollment = module.enrollments.find(
      e => e.employee.toString() === req.user._id.toString()
    );

    if (!enrollment)
      return res.status(404).json({
        success: false,
        message: 'Not enrolled'
      });

    enrollment.progress = progress;
    enrollment.status =
      progress === 100 ? 'completed' : 'in-progress';

    if (progress === 100)
      enrollment.completedAt = new Date();

    await module.save();

    res.json({
      success: true,
      data: enrollment
    });

  } catch (err) {
    next(err);
  }
};

// ===========================
// Get My Modules
// ===========================
exports.getMyModules = async (req, res, next) => {
  try {
    const modules = await Learning.find({
      organizationId: req.user.organizationId,
      'enrollments.employee': req.user._id
    });

    res.json({
      success: true,
      data: modules
    });

  } catch (err) {
    next(err);
  }
};
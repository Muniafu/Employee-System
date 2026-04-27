const Performance = require('../models/Performance');
const User = require('../models/User');

// ===========================
// Create Review
// ===========================
exports.createReview = async (req, res, next) => {
  try {
    const { employee, period, goals, rating, feedback } = req.body;

    const review = await Performance.create({
      employee,
      reviewer: req.user._id,
      organizationId: req.user.organizationId,
      period,
      goals,
      rating,
      feedback
    });

    res.status(201).json({
      success: true,
      data: review
    });

  } catch (err) {
    next(err);
  }
};

// ===========================
// Update Review
// ===========================
exports.updateReview = async (req, res, next) => {
  try {
    const review = await Performance.findOneAndUpdate(
      {
        _id: req.params.id,
        organizationId: req.user.organizationId,
        status: 'draft'
      },
      req.body,
      { new: true }
    );

    if (!review)
      return res.status(404).json({
        success: false,
        message: 'Review not found or already finalized'
      });

    res.json({
      success: true,
      data: review
    });

  } catch (err) {
    next(err);
  }
};

// ===========================
// Finalize Review
// ===========================
exports.finalizeReview = async (req, res, next) => {
  try {
    const review = await Performance.findOneAndUpdate(
      {
        _id: req.params.id,
        organizationId: req.user.organizationId
      },
      { status: 'finalized' },
      { new: true }
    );

    res.json({
      success: true,
      data: review
    });

  } catch (err) {
    next(err);
  }
};

// ===========================
// Get My Reviews (Employee)
// ===========================
exports.getMyReviews = async (req, res, next) => {
  try {
    const reviews = await Performance.find({
      employee: req.user._id,
      organizationId: req.user.organizationId
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: reviews
    });

  } catch (err) {
    next(err);
  }
};

// ===========================
// Get Reviews by Employee (Admin)
// ===========================
exports.getByEmployee = async (req, res, next) => {
  try {
    const reviews = await Performance.find({
      employee: req.params.employeeId,
      organizationId: req.user.organizationId
    });

    res.json({
      success: true,
      data: reviews
    });

  } catch (err) {
    next(err);
  }
};

// ===========================
// Get All Reviews (Admin)
// ===========================
exports.getAll = async (req, res, next) => {
  try {
    const reviews = await Performance.find({
      organizationId: req.user.organizationId
    })
      .populate('employee', 'name email')
      .populate('reviewer', 'name');

    res.json({
      success: true,
      data: reviews
    });

  } catch (err) {
    next(err);
  }
};
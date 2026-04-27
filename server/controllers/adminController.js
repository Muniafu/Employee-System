const User = require('../models/User');

// ===========================
// Create User (Admin Only)
// ===========================
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });

    const user = await User.create({
      name,
      email,
      password,
      role,
      organizationId: req.user.organizationId
    });

    res.status(201).json({
      success: true,
      data: user
    });

  } catch (err) {
    next(err);
  }
};

// ===========================
// Get All Users (Tenant Scoped)
// ===========================
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find({
      organizationId: req.user.organizationId
    }).select('-password');

    res.json({
      success: true,
      data: users
    });

  } catch (err) {
    next(err);
  }
};

// ===========================
// Update Role
// ===========================
exports.updateUserRole = async (req, res, next) => {
  try {
    const user = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        organizationId: req.user.organizationId
      },
      { role: req.body.role },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      data: user
    });

  } catch (err) {
    next(err);
  }
};

// ===========================
// Deactivate User
// ===========================
exports.deactivateUser = async (req, res, next) => {
  try {
    await User.findOneAndUpdate(
      {
        _id: req.params.id,
        organizationId: req.user.organizationId
      },
      { active: false }
    );

    res.json({
      success: true,
      message: 'User deactivated'
    });

  } catch (err) {
    next(err);
  }
};
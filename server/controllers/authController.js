const User = require('../models/User');
const Employee = require('../models/Employee');

const { signToken } = require('../utils/token');

const sendAuth = (user, code, res) => {
  const token = signToken({
    id: user._id,
    role: user.role,
  });

  const safeUser = user.toObject();

  delete safeUser.password;

  res.status(code).json({
    success: true,
    data: {
      token,
      user: safeUser,
    },
  });
};

const createUserWithEmployee = async ({
  firstName,
  lastName,
  email,
  password,
  role = 'employee',
  department = '',
  position = '',
  phone = '',
  salary = 0,
}) => {

  const existing = await User.findOne({ email });

  if (existing) {
    const err = new Error('Email already registered.');
    err.statusCode = 409;
    throw err;
  }

  const createdUser = await User.create({
    firstName,
    lastName,
    email,
    password,
    role,
  });

  await Employee.create({
    user: createdUser._id,
    department,
    position,
    phone,
    salary,
  });

  return createdUser;
};

// PUBLIC EMPLOYEE REGISTER
exports.register = async (req, res, next) => {
  try {

    const {
      firstName,
      lastName,
      email,
      password,
      department,
      position,
      phone,
      salary,
    } = req.body;

    const user = await createUserWithEmployee({
      firstName,
      lastName,
      email,
      password,
      role: 'employee',
      department,
      position,
      phone,
      salary,
    });

    user.lastLogin = new Date();

    await user.save({
      validateBeforeSave: false,
    });

    sendAuth(user, 201, res);

  } catch (err) {
    next(err);
  }
};

// LOGIN
exports.login = async (req, res, next) => {
  try {

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password required.',
      });
    }

    const user = await User
      .findOne({ email })
      .select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account deactivated.',
      });
    }

    user.lastLogin = new Date();

    await user.save({
      validateBeforeSave: false,
    });

    sendAuth(user, 200, res);

  } catch (err) {
    next(err);
  }
};

// CURRENT USER
exports.getMe = async (req, res, next) => {
  try {

    const employee = await Employee.findOne({
      user: req.user._id,
    });

    res.status(200).json({
      success: true,
      data: {
        user: req.user,
        employee,
      },
    });

  } catch (err) {
    next(err);
  }
};

// ADMIN REGISTER
exports.registerAdmin = async (req, res, next) => {
  try {

    const {
      firstName,
      lastName,
      email,
      password,
      role,
      department,
      position,
      phone,
      salary,
    } = req.body;

    const user = await createUserWithEmployee({
      firstName,
      lastName,
      email,
      password,
      role: role || 'admin',
      department,
      position,
      phone,
      salary,
    });

    res.status(201).json({
      success: true,
      data: {
        user,
      },
    });

  } catch (err) {
    next(err);
  }
};

// CHANGE PASSWORD
exports.changePassword = async (req, res, next) => {
  try {

    const {
      currentPassword,
      newPassword,
    } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Both passwords required.',
      });
    }

    const user = await User
      .findById(req.user._id)
      .select('+password');

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Current password incorrect.',
      });
    }

    user.password = newPassword;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });

  } catch (err) {
    next(err);
  }
};
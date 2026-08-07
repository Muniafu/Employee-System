const User = require('../models/User');
const Employee = require('../models/Employee');
const crypto = require('crypto');

const {
  sendEmail,
  templates,
} = require('../utils/emailService');

const { signToken } = require('../utils/token');

/*
|--------------------------------------------------------------------------
| AUTH RESPONSE HELPER
|--------------------------------------------------------------------------
| Creates a safe authentication response containing:
| - JWT token
| - sanitized user
| - employee profile
|
| IMPORTANT:
| Employee.findOne() MUST be awaited.
| Returning the Mongoose Query object directly to res.json()
| causes the "Converting circular structure to JSON" error.
|--------------------------------------------------------------------------
*/

const sendAuth = async (user, code, res) => {
  const token = signToken({
    id: user._id,
    role: user.role,
  });

  const safeUser = user.toObject();

  // Never expose sensitive authentication fields.
  delete safeUser.password;
  delete safeUser.passwordResetToken;
  delete safeUser.passwordResetExpires;
  delete safeUser.emailVerificationToken;
  delete safeUser.emailVerificationExpires;

  const employee = await Employee.findOne({
    user: user._id,
  })
    .select('_id employeeId department position status')
    .lean();

  return res.status(code).json({
    success: true,
    data: {
      token,

      user: {
        ...safeUser,
        hasEmployeeProfile: Boolean(employee),
      },

      employee: employee || null,
    },
  });
};

/*
|--------------------------------------------------------------------------
| CREATE USER + EMPLOYEE PROFILE
|--------------------------------------------------------------------------
*/

const createUserWithEmployee = async ({
  firstName,
  lastName,
  email,
  password,
  role = 'employee',
  status = 'PENDING',
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

  /*
   * Bootstrap the system.
   *
   * The first registered user becomes the protected superuser.
   */
  const userCount = await User.countDocuments();

  const isFirstUser = userCount === 0;

  const createdUser = await User.create({
    firstName,
    lastName,
    email,
    password,

    role: isFirstUser ? 'superuser' : role,

    status: isFirstUser ? 'APPROVED' : status,

    isSystem: isFirstUser,

    protectedAccount: isFirstUser,
  });

  /*
   * Every registered user receives an employee profile.
   */
  await Employee.create({
    user: createdUser._id,
    department,
    position,
    phone,
    salary,
  });

  return createdUser;
};

/*
|--------------------------------------------------------------------------
| PUBLIC EMPLOYEE REGISTRATION
|--------------------------------------------------------------------------
*/

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
      department,
      position,
      phone,
      salary,
    });

    /*
     * First user is automatically approved and becomes superuser.
     */
    if (user.status === 'APPROVED') {
      user.lastLogin = new Date();

      await user.save({
        validateBeforeSave: false,
      });

      const token = signToken({
        id: user._id,
        role: user.role,
      });

      const safeUser = user.toObject();

      delete safeUser.password;
      delete safeUser.passwordResetToken;
      delete safeUser.passwordResetExpires;
      delete safeUser.emailVerificationToken;
      delete safeUser.emailVerificationExpires;

      return res.status(201).json({
        success: true,
        message: 'System initialized successfully.',
        data: {
          approved: true,
          token,
          user: safeUser,
        },
      });
    }

    /*
     * Normal employees require administrator approval.
     */
    return res.status(202).json({
      success: true,
      message:
        'Registration successful. Your account is awaiting administrator approval.',
      data: {
        approved: false,
      },
    });
  } catch (err) {
    next(err);
  }
};

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

exports.login = async (req, res, next) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password required.',
      });
    }

    /*
     * Password is explicitly selected because the User schema
     * has select: false.
     */
    const user = await User
      .findOne({ email })
      .select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    /*
     * Account lifecycle checks.
     */
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account deactivated.',
      });
    }

    if (user.status === 'PENDING') {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending approval.',
      });
    }

    if (user.status === 'REJECTED') {
      return res.status(403).json({
        success: false,
        message: 'Your account request was rejected.',
      });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended.',
      });
    }

    /*
     * Record successful login.
     */
    user.lastLogin = new Date();

    await user.save({
      validateBeforeSave: false,
    });

    /*
     * sendAuth fetches the employee profile safely.
     */
    return await sendAuth(user, 200, res);
  } catch (err) {
    next(err);
  }
};

/*
|--------------------------------------------------------------------------
| CURRENT USER
|--------------------------------------------------------------------------
*/

exports.getMe = async (req, res, next) => {
  try {
    if (req.user.status !== 'APPROVED') {
      return res.status(403).json({
        success: false,
        message: 'Account not approved.',
      });
    }

    const employee = await Employee.findOne({
      user: req.user._id,
    })
      .select('_id employeeId department position status')
      .lean();

    /*
     * req.user may be a Mongoose document depending on
     * authMiddleware implementation.
     */
    const safeUser = req.user.toObject
      ? req.user.toObject()
      : { ...req.user };

    delete safeUser.password;
    delete safeUser.passwordResetToken;
    delete safeUser.passwordResetExpires;
    delete safeUser.emailVerificationToken;
    delete safeUser.emailVerificationExpires;

    return res.status(200).json({
      success: true,
      data: {
        user: safeUser,
        employee: employee || null,
      },
    });
  } catch (err) {
    next(err);
  }
};

/*
|--------------------------------------------------------------------------
| ADMIN / HR REGISTRATION
|--------------------------------------------------------------------------
*/

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

    const allowedRoles = [
      'employee',
      'manager',
      'hr',
      'admin',
    ];

    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role assignment.',
      });
    }

    /*
     * Only superuser can create admin accounts.
     */
    if (
      role === 'admin' &&
      req.user.role !== 'superuser'
    ) {
      return res.status(403).json({
        success: false,
        message:
          'Only superusers can create admin accounts.',
      });
    }

    /*
     * Superusers cannot be created through this endpoint.
     */
    if (role === 'superuser') {
      return res.status(403).json({
        success: false,
        message:
          'Superuser accounts cannot be created through this endpoint.',
      });
    }

    const user = await createUserWithEmployee({
      firstName,
      lastName,
      email,
      password,
      role: role || 'manager',
      status: 'APPROVED',
      department,
      position,
      phone,
      salary,
    });

    const safeUser = user.toObject();

    delete safeUser.password;
    delete safeUser.passwordResetToken;
    delete safeUser.passwordResetExpires;
    delete safeUser.emailVerificationToken;
    delete safeUser.emailVerificationExpires;

    return res.status(201).json({
      success: true,
      message: 'Privileged account created successfully.',
      data: {
        user: safeUser,
      },
    });
  } catch (err) {
    next(err);
  }
};

/*
|--------------------------------------------------------------------------
| CHANGE PASSWORD
|--------------------------------------------------------------------------
*/

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

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    const validPassword =
      await user.comparePassword(currentPassword);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password incorrect.',
      });
    }

    user.password = newPassword;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (err) {
    next(err);
  }
};

/*
|--------------------------------------------------------------------------
| FORGOT PASSWORD
|--------------------------------------------------------------------------
*/

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
    }

    const user = await User
      .findOne({ email })
      .select(
        '+passwordResetToken +passwordResetExpires'
      );

    /*
     * Prevent account enumeration.
     */
    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          'If an account exists for this email, a reset link has been sent.',
      });
    }

    /*
     * Create secure reset token.
     */
    const resetToken =
      user.createPasswordResetToken();

    await user.save({
      validateBeforeSave: false,
    });

    /*
     * Frontend reset URL.
     */
    const resetURL =
      `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    const emailTemplate =
      templates.passwordReset(
        user.fullName,
        resetURL
      );

    const result = await sendEmail({
      to: user.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });

    /*
     * If email delivery fails, invalidate the token.
     */
    if (!result.success) {
      user.clearPasswordReset();

      await user.save({
        validateBeforeSave: false,
      });

      return res.status(500).json({
        success: false,
        message: 'Unable to send reset email.',
      });
    }

    return res.status(200).json({
      success: true,
      message:
        'If an account exists for this email, a reset link has been sent.',
    });
  } catch (err) {
    next(err);
  }
};

/*
|--------------------------------------------------------------------------
| RESET PASSWORD
|--------------------------------------------------------------------------
*/

exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'New password is required.',
      });
    }

    /*
     * Hash incoming reset token.
     */
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User
      .findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          $gt: Date.now(),
        },
      })
      .select(
        '+passwordResetToken +passwordResetExpires +password'
      );

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          'Reset link is invalid or has expired.',
      });
    }

    /*
     * Update password and invalidate reset token.
     */
    user.password = password;

    user.clearPasswordReset();

    await user.save();

    /*
     * Auto-login after successful password reset.
     */
    user.lastLogin = new Date();

    await user.save({
      validateBeforeSave: false,
    });

    return await sendAuth(user, 200, res);
  } catch (err) {
    next(err);
  }
};
const User = require('../models/User');
const Employee = require('../models/Employee');
const crypto = require('crypto');

const {
  sendEmail,
  templates,
} = require('../utils/emailService');

const { signToken } = require('../utils/token');
const { dispatchNotification } = require('../services/notificationOrchestrator');

const { confirmPendingLink } = require('../services/socialAuthService');

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
| SEND VERIFICATION EMAIL HELPER
|--------------------------------------------------------------------------
| Shared by register() and resendVerification() so both stay in sync.
| Verification failures never block registration — they're logged and
| swallowed by the caller.
|--------------------------------------------------------------------------
*/

const sendVerificationEmail = async (user) => {
  const rawToken = user.createEmailVerificationToken();

  await user.save({
    validateBeforeSave: false,
  });

  const verifyURL = 
    `${process.env.CLIENT_URL}/verify-email/${rawToken}?email=${encodeURIComponent(user.email)}`

  const emailTemplate =
    templates.emailVerification(user.fullName, verifyURL);

  return sendEmail({
    to: user.email,
    subject: emailTemplate.subject,
    html: emailTemplate.html,
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

    role: isFirstUser ? 'admin' : role,

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
      phone,
    } = req.body;

    const user = await createUserWithEmployee({
      firstName,
      lastName,
      email,
      password,
      phone,
    });

    /*
     * Send the initial email verification link.
     *
     * This is intentionally fire-and-forget with respect to the
     * registration response: a failed email send should never
     * block account creation. The user can always request another
     * link via resendVerification().
     */
    try {
      await sendVerificationEmail(user);
    } catch (verificationErr) {
      console.error(
        'Failed to send verification email:',
        verificationErr
      );
    }

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

      try {
        const admins = await User.find({
          role: { $in: ['admin', 'superuser', 'hr'] },
          status: 'APPROVED',
        }).select('_id email');

        await Promise.allSettled(
          admins.map((admin) =>
            dispatchNotification({
              recipient: admin._id,
              channels: ['inApp', 'email'],
              type: 'account',
              title: 'New Registration awaiting approval',
              message: `${user.fullName} (${user.email}) has registered and is waiting approbal. Please review their account.`,
              email: admin.email,
              link: '/admin/users',
              priority: 'medium',
              data: { userId: user._id },
            })
          )
        );
      } catch (notifyErr) {
        console.error(
          'Failed to notify admins of new registration:',
          notifyErr
        );
      }

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
        'Registration successful. Please check your email to verify your address. Your account is also awaiting administrator approval.',
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

    if (!user || !user.password || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    /*
     * Email must be verified before any account-status checks run.
     * This is deliberately checked first: it's the one blocker the
     * user can resolve immediately themselves (resend + click link),
     * unlike PENDING/SUSPENDED/TERMINATED which require an admin.
     */
    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email address before logging in.',
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

    if (user.status === 'TERMINATED') {
      return res.status(403).json({
        success: false,
        message: 'This account has been terminated.',
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

    /*
     * Admin-created accounts still verify their own email,
     * they're just not blocked on approval since status is
     * already APPROVED.
     */
    try {
      await sendVerificationEmail(user);
    } catch (verificationErr) {
      console.error(
        'Failed to send verification email:',
        verificationErr
      );
    }

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
      `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

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

/*
|--------------------------------------------------------------------------
| VERIFY EMAIL
|--------------------------------------------------------------------------
*/

exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Verification link is invalid or has expired.',
      });
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully.',
    });
  } catch (err) {
    next(err);
  }
};

/*
|--------------------------------------------------------------------------
| RESEND VERIFICATION
|--------------------------------------------------------------------------
*/

exports.resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
    }

    const user = await User.findOne({ email });

    /*
     * Prevent account enumeration — same response shape whether or
     * not the account exists.
     */
    const genericResponse = {
      success: true,
      message:
        'If an account exists for this email, a verification link has been sent.',
    };

    if (!user) {
      return res.status(200).json(genericResponse);
    }

    if (user.emailVerified) {
      return res.status(200).json({
        success: true,
        message: 'This email is already verified.',
      });
    }

    const result = await sendVerificationEmail(user);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Unable to send verification email.',
      });
    }

    return res.status(200).json(genericResponse);
  } catch (err) {
    next(err);
  }
};

/*
|--------------------------------------------------------------------------
| SOCIAL LOGIN CALLBACK
|--------------------------------------------------------------------------
*/

exports.socialCallback = async (req, res) => {
  const result = req.user; // set by passport in the strategy verify callback

  if (result.status === 'PENDING_LINK') {
    return res.redirect(
      `${process.env.CLIENT_URL}/social-pending?message=${encodeURIComponent(result.message)}`
    );
  }

  if (result.status === 'PENDING_APPROVAL') {
    return res.redirect(`${process.env.CLIENT_URL}/pending-approval`);
  }

  // LOGIN
  const user = result.user;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = signToken({ id: user._id, role: user.role });
  return res.redirect(`${process.env.CLIENT_URL}/oauth-callback?token=${token}`);
};

exports.confirmLink = async (req, res, next) => {
  try {
    const user = await confirmPendingLink(req.params.token);
    return res.status(200).json({
      success: true,
      message: `Your ${user.linkedAccounts.at(-1).provider} account is now linked. You can sign in with it.`,
    });
  } catch (err) {
    next(err);
  }
};
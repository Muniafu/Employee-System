const User = require('../models/User');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Policy = require('../models/Policy');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const Attendance = require('../models/Attendance');
const Offboarding = require('../models/Offboarding');
const { dispatchNotification } = require('../services/notificationOrchestrator');

// GET /api/admin/dashboard-summary
exports.summary = async (req, res, next) => {
  try {

    const [
      totalUsers,
      activeEmployees,
      pendingLeaves,
      departments,
      recentPayrolls,
    ] = await Promise.all([
      User.countDocuments(),

      Employee.countDocuments({
        status: 'active',
      }),

      Leave.countDocuments({
        status: 'pending',
      }),

      Department.countDocuments({
        isActive: true,
      }),

      Payroll.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate({
          path: 'employee',
          populate: {
            path: 'user',
            select: 'firstName lastName',
          },
        }),
    ]);

    const roleBreakdown =
      await User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
          },
        },
      ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeEmployees,
        pendingLeaves,
        departments,
        roleBreakdown,
        recentPayrolls,
      },
    });

  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, status, isActive, search } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (status) filter.status = status;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter).sort({ createdAt: -1 }).lean();

    // Attach Employee lifecycle status alongside account status
    const employees = await Employee.find({ user: { $in: users.map(u => u._id) } })
      .select('user status department')
      .lean();

    const empByUser = new Map(employees.map(e => [String(e.user), e]));

    const enriched = users.map(u => ({
      ...u,
      employeeStatus: empByUser.get(String(u._id))?.status || null,
      department: empByUser.get(String(u._id))?.department || null,
    }));

    res.status(200).json({ success: true, count: enriched.length, data: enriched });
  } catch (err) { next(err); }
};

// PATCH /api/admin/users/:id/approve
exports.approveUser = async (req, res, next) => {
  try {
    const { department, position, managerId } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.status === 'APPROVED') {
      return res.status(400).json({ success: false, message: 'User already approved.' });
    }

    if (department) {
      const dept = await Department.findOne({ name: department, isActive: true });
      if (!dept) {
        return res.status(400).json({
          success: false,
          message: `Department "${department}" does not exist or is inactive.`,
        });
      }
    }

    user.status = 'APPROVED';
    user.isActive = true;
    await user.save({ validateBeforeSave: false });

    try {
      await dispatchNotification({
        recipient: user._id,
        channels: ['email', 'inApp'],
        type: 'account',
        title: 'Account Approved',
        message: 'Your account has been approved. You can now log in.',
        email: user.email,
        link: '/login',
        priority: 'high',
      });
    } catch (notifyErr) {
      console.error('Notify (approve) failed:', notifyErr);
    }

    const existingEmployee = await Employee.findOne({ user: user._id });

    if (existingEmployee) {
      if (department) existingEmployee.department = department;
      if (position) existingEmployee.position = position;
      if (managerId) existingEmployee.manager = managerId;
    } else {
      await Employee.create({
        user: user._id,
        department: department || '',
        position: position || '',
        manager: managerId || undefined,
        status: 'pending',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User approved successfully. Employee is pending onboarding.',
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/users/:id/reject
exports.rejectUser = async (req, res, next) => {
  try {

    const user =
      await User.findById(
        req.params.id
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (user.isSystem || user.protectedAccount) {
      return res.status(403).json({
        success: false,
        message:
          'Protected system accounts cannot be rejected.',
      });
    }

    user.status = 'REJECTED';
    user.isActive = false;
    await user.save({ validateBeforeSave: false });

    try {
      await dispatchNotification({
        recipient: user._id,
        channels: ['inApp', 'email'],
        type: 'account',
        title: 'Registration rejected',
        message: 'Your account registration was not approved. Contact HR for details.',
        email: user.email,
        priority: 'high',
      });
    } catch (notifyErr) { console.error('Notify (reject) failed:', notifyErr); }

    res.status(200).json({
      success: true,
      message:
        'User registration rejected.',
      data: user,
    });

  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/users/:id/suspend
exports.suspendUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.isSystem || user.protectedAccount) {
      return res.status(403).json({
        success: false,
        message: 'Protected system accounts cannot be suspended.',
      });
    }

    if (req.user._id.toString() === user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You cannot suspend your own account.',
      });
    }

    const employee = await Employee.findOne({ user: user._id });

    if (employee?.status === 'terminated') {
      return res.status(409).json({ success: false, message: 'User is already terminated.' });
    }

    user.status = 'SUSPENDED';
    user.isActive = false;
    await user.save({ validateBeforeSave: false });

    try {
      await dispatchNotification({
        recipient: user._id,
        channels: ['inApp', 'email'],
        type: 'account',
        title: 'Account suspended',
        message: 'Your account has been suspended. Contact HR if you believe this is a mistake.',
        email: user.email,
        priority: 'critical',
      });
    } catch (notifyErr) { console.error('Notify (suspend) failed:', notifyErr); }

    if (employee && employee.status !== 'offboarding') {
      employee.status = 'suspended';
      await employee.save();
    }

    res.status(200).json({
      success: true,
      message: 'User suspended successfully.',
      data: user,
    });
  } catch (err) { next(err); }
};

// PATCH /api/admin/users/:id/terminate
exports.terminateUser = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.isSystem || user.protectedAccount) {
      return res.status(403).json({
        success: false,
        message: 'Protected system accounts cannot be terminated.',
      });
    }

    if (req.user._id.toString() === user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You cannot terminate your own account.',
      });
    }

    if (user.status === 'TERMINATED') {
      return res.status(409).json({ success: false, message: 'User is already terminated.' });
    }

    const employee = await Employee.findOne({ user: user._id });

    if (employee) {
      const activeOffboarding = await Offboarding.findOne({
        employee: employee._id,
        phase: { $ne: 'completed' },
      });

      if (activeOffboarding) {
        return res.status(409).json({
          success: false,
          message: 'This employee has an offboarding checklist in progress. Complete it via the offboarding workflow instead of terminating directly.',
        });
      }
    }

    user.terminate(reason);
    user.isActive = false;
    await user.save({ validateBeforeSave: false });

    if (employee && employee.status !== 'terminated') {
      employee.status = 'terminated';
      await employee.save();
    }

    try {
      await dispatchNotification({
        recipient: user._id,
        channels: ['inApp', 'email'],
        type: 'account',
        title: 'Account terminated',
        message: reason
          ? `Your account has been terminated. Reason: ${reason}`
          : 'Your account has been terminated.',
        email: user.email,
        priority: 'critical',
      });
    } catch (notifyErr) { console.error('Notify (terminate) failed:', notifyErr); }

    res.status(200).json({
      success: true,
      message: 'User terminated successfully.',
      data: user,
    });
  } catch (err) { next(err); }
};

// PATCH /api/admin/users/:id/role
exports.changeRole = async (req, res, next) => {
  try {

    const { role } = req.body;

    const allowedRoles = [
      'employee',
      'manager',
      'hr',
      'admin',
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role.',
      });
    }

    const user =
      await User.findById(
        req.params.id
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (
      user.isSystem ||
      user.protectedAccount
    ) {
      return res.status(403).json({
        success: false,
        message:
          'Protected system accounts cannot be modified.',
      });
    }

    if (
      req.user._id.toString() ===
        user._id.toString() &&
      role !== req.user.role
    ) {
      return res.status(403).json({
        success: false,
        message:
          'You cannot change your own role.',
      });
    }

    user.role = role;

    await user.save({
      validateBeforeSave: false,
    });

    res.status(200).json({
      success: true,
      message:
        'Role updated successfully.',
      data: user,
    });

  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/users/:id/reactivate
exports.reactivateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (user.status !== 'SUSPENDED') {
      return res.status(409).json({ success: false, message: 'Only suspended users can be reactivated.' });
    }

    const employee = await Employee.findOne({ user: user._id });

    if (employee?.status === 'terminated') {
      return res.status(409).json({
        success: false,
        message: 'This employee was terminated via offboarding and cannot be reactivated here.',
      });
    }

    user.status = 'APPROVED';
    user.isActive = true;
    await user.save({ validateBeforeSave: false });

    if (employee && employee.status === 'suspended') {
      employee.status = 'active';
      await employee.save();
    }

    res.status(200).json({ success: true, message: 'User reactivated.', data: user });
  } catch (err) { next(err); }
};

// PATCH /api/admin/users/:id/reinstate  — companion to reactivateUser,
// but for TERMINATED accounts specifically (reactivateUser only handles SUSPENDED)
exports.reinstateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.status !== 'TERMINATED') {
      return res.status(409).json({ success: false, message: 'Only terminated users can be reinstated.' });
    }

    user.reinstate();
    user.isActive = true;
    await user.save({ validateBeforeSave: false });

    const employee = await Employee.findOne({ user: user._id });
    if (employee?.status === 'terminated') {
      employee.status = 'pending'; // re-enters onboarding, mirrors approveUser's fresh-hire path
      await employee.save();
    }

    res.status(200).json({ success: true, message: 'User reinstated.', data: user });
  } catch (err) { next(err); }
};

// PATCH /api/admin/users/:id/toggle-active
exports.toggleActive = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.isSystem || user.protectedAccount) {
      return res.status(403).json({
        success: false,
        message: 'Protected system accounts cannot be deactivated.',
      });
    }

    if (req.user._id.toString() === user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You cannot deactivate your own account.',
      });
    }

    const employee = await Employee.findOne({ user: user._id });

    if (employee && ['offboarding', 'terminated'].includes(employee.status)) {
      return res.status(409).json({
        success: false,
        message: `Cannot toggle access — employee status is "${employee.status}". Use the offboarding workflow instead.`,
      });
    }

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    if (employee) {
      employee.status = user.isActive ? 'active' : 'suspended';
      await employee.save();
    }

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'suspended'}.`,
      data: user,
    });
  } catch (err) { next(err); }
};

// --- DEPARTMENTS ---
exports.getDepartments = async (req, res, next) => {
  try {

    const depts =
      await Department.find()
        .populate(
          'head',
          'firstName lastName email'
        );

    res.status(200).json({
      success: true,
      count: depts.length,
      data: depts,
    });

  } catch (err) {
    next(err);
  }
};

exports.createDepartment = async (req, res, next) => {
  try {

    const dept =
      await Department.create(req.body);

    res.status(201).json({
      success: true,
      data: dept,
    });

  } catch (err) {
    next(err);
  }
};

exports.updateDepartment = async (req, res, next) => {
  try {

    const dept =
      await Department.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!dept) {
      return res.status(404).json({
        success: false,
        message:
          'Department not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: dept,
    });

  } catch (err) {
    next(err);
  }
};

// --- POLICIES ---
exports.getPolicies = async (req, res, next) => {
  try {

    const policies =
      await Policy.find({
        isActive: true,
      })
        .populate(
          'createdBy',
          'firstName lastName'
        )
        .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: policies.length,
      data: policies,
    });

  } catch (err) {
    next(err);
  }
};

exports.createPolicy = async (req, res, next) => {
  try {

    const policy =
      await Policy.create({
        ...req.body,
        createdBy: req.user._id,
      });

    res.status(201).json({
      success: true,
      data: policy,
    });

  } catch (err) {
    next(err);
  }
};

// GET /api/admin/audit
exports.auditLog = async (req, res, next) => {
  try {

    const { type } = req.query;

    const result = {};

    if (
      !type ||
      type === 'payroll'
    ) {
      result.payroll =
        await Payroll.find({
          status: 'finalized',
        })
          .populate({
            path: 'employee',
            populate: {
              path: 'user',
              select:
                'firstName lastName email',
            },
          })
          .populate(
            'finalizedBy',
            'firstName lastName'
          )
          .sort({
            finalizedAt: -1,
          })
          .limit(50);
    }

    if (
      !type ||
      type === 'leave'
    ) {
      result.leave =
        await Leave.find({
          status: {
            $in: [
              'approved',
              'rejected',
            ],
          },
        })
          .populate({
            path: 'employee',
            populate: {
              path: 'user',
              select:
                'firstName lastName',
            },
          })
          .populate(
            'approvedBy',
            'firstName lastName'
          )
          .sort({
            approvedAt: -1,
          })
          .limit(50);
    }

    res.status(200).json({
      success: true,
      data: result,
    });

  } catch (err) {
    next(err);
  }
};
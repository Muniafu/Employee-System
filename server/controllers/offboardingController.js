const Offboarding = require('../models/Offboarding');
const Employee = require('../models/Employee');
const User = require('../models/User');
const { DEPARTMENT_OFFBOARDING_TASKS, getDepartmentTasks } = require('../utils/departmentTaskTemplates');
const { dispatchNotification } = require('../services/notificationOrchestrator');

const DEFAULT_TASKS = [
  { title: 'Exit interview', category: 'exit_interview', assignedTo: 'hr', required: true },
  { title: 'Return company laptop', category: 'asset_return', assignedTo: 'employee', required: true },
  { title: 'Return ID / access card', category: 'asset_return', assignedTo: 'employee', required: true },
  { title: 'Revoke system access', category: 'access_revocation', assignedTo: 'it', required: true },
  { title: 'Knowledge transfer handover', category: 'knowledge_transfer', assignedTo: 'employee', required: true },
  { title: 'Clear outstanding leave balance', category: 'leave_clearance', assignedTo: 'hr', required: true },
  { title: 'Process final payroll', category: 'payroll', assignedTo: 'finance', required: true, dependsOn: ['leave_clearance'] },
  { title: 'Manager clearance sign-off', category: 'clearance', assignedTo: 'manager', required: true, dependsOn: ['asset_return', 'knowledge_transfer'] },
  { title: 'Final documentation & records update', category: 'documentation', assignedTo: 'hr', required: true, dependsOn: ['clearance'] },
];

function canCompleteOffboardingTask(task, userRole, isOwnRecord, isManagerOfRecord) {
  if (userRole === 'admin') return true;

  switch (task.assignedTo) {
    case 'employee':
      return isOwnRecord;
    case 'hr':
      return userRole === 'hr';
    case 'it':
    case 'finance':
      return userRole === 'hr'; // no dedicated IT/Finance role today
    case 'manager':
      return userRole === 'manager' && isManagerOfRecord;
    default:
      return false;
  }
}

function unmetDependencies(offboarding, task) {
  if (!task.dependsOn?.length) return [];
  return task.dependsOn.filter((category) => {
    const depTasks = offboarding.tasks.filter(t => t.category === category && t.required);
    if (!depTasks.length) return false;
    return !depTasks.every(t => t.completed);
  });
}

async function recalcAndSync(offboarding) {
  offboarding.progress = offboarding.calculateProgress();

  if (offboarding.phase === 'initiated') {
    offboarding.phase = 'in_progress';
  }

  if (offboarding.progress === 100 && offboarding.phase !== 'completed') {
    offboarding.phase = 'pending_approval';
  }

  await offboarding.save();
}

// POST /api/offboarding
exports.initiate = async (req, res, next) => {
  try {
    const { employeeId, type, lastWorkingDay, reason } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });

    if (!['active', 'probation', 'on_leave'].includes(employee.status)) {
      return res.status(409).json({
        success: false,
        message: `Cannot initiate offboarding for an employee with status "${employee.status}".`,
      });
    }

    if (req.user.role === 'manager' && String(employee.manager) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You can only offboard your own direct reports.' });
    }

    const existing = await Offboarding.findOne({ employee: employeeId });
    if (existing) return res.status(409).json({ success: false, message: 'Offboarding already initiated for this employee.' });

    if (!lastWorkingDay) {
      return res.status(400).json({ success: false, message: 'Last working day is required.' });
    }

    const tasks = [
      ...DEFAULT_TASKS,
      ...getDepartmentTasks(DEPARTMENT_OFFBOARDING_TASKS, employee.department),
    ];

    const offboarding = await Offboarding.create({
      employee: employeeId,
      type: type || 'resignation',
      reason: reason || '',
      lastWorkingDay,
      initiatedBy: req.user._id,
      tasks,
    });

    employee.status = 'offboarding';
    await employee.save();

    res.status(201).json({ success: true, data: offboarding });
  } catch (err) { next(err); }
};

// GET /api/offboarding/me
exports.getMyOffboarding = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });

    const offboarding = await Offboarding.findOne({ employee: employee._id });
    if (!offboarding) return res.status(404).json({ success: false, message: 'No offboarding record found.' });

    res.status(200).json({ success: true, data: offboarding });
  } catch (err) { next(err); }
};

// GET /api/offboarding/all — HR/Admin/Superuser see everyone; manager sees only direct reports
exports.getAll = async (req, res, next) => {
  try {
    let query = Offboarding.find();

    if (req.user.role === 'manager') {
      const managed = await Employee.find({ manager: req.user._id }).select('_id');
      query = Offboarding.find({ employee: { $in: managed.map(e => e._id) } });
    }

    const records = await query
      .populate({
        path: 'employee',
        populate: { path: 'user', select: 'firstName lastName email' },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: records.length, data: records });
  } catch (err) { next(err); }
};

async function resolveTargetAndPermissions(req, paramEmployeeId) {
  const requesterEmployee = await Employee.findOne({ user: req.user._id });

  let employeeRecordId = paramEmployeeId;
  let isOwnRecord = false;
  let targetEmployee;

  if (!employeeRecordId) {
    if (!requesterEmployee) throw Object.assign(new Error('Employee not found.'), { status: 404 });
    employeeRecordId = requesterEmployee._id;
    isOwnRecord = true;
    targetEmployee = requesterEmployee;
  } else {
    isOwnRecord = requesterEmployee && String(requesterEmployee._id) === String(paramEmployeeId);
    targetEmployee = await Employee.findById(paramEmployeeId);
    if (!targetEmployee) throw Object.assign(new Error('Employee not found.'), { status: 404 });
  }

  const isManagerOfRecord =
    targetEmployee.manager && String(targetEmployee.manager) === String(req.user._id);

  return { employeeRecordId, isOwnRecord, isManagerOfRecord, targetEmployee };
}

// PATCH /api/offboarding/tasks/:taskId/complete  (self)
// PATCH /api/offboarding/:employeeId/tasks/:taskId/complete  (hr/admin/manager)
exports.completeTask = async (req, res, next) => {
  try {
    const { taskId, employeeId: paramEmployeeId } = req.params;

    const { employeeRecordId, isOwnRecord, isManagerOfRecord } =
      await resolveTargetAndPermissions(req, paramEmployeeId);

    const offboarding = await Offboarding.findOne({ employee: employeeRecordId });
    if (!offboarding) return res.status(404).json({ success: false, message: 'Offboarding not found.' });

    const task = offboarding.tasks.id(taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    if (task.completed) {
      return res.status(409).json({ success: false, message: 'Task already completed.' });
    }

    if (!canCompleteOffboardingTask(task, req.user.role, isOwnRecord, isManagerOfRecord)) {
      return res.status(403).json({
        success: false,
        message: `This task is assigned to ${task.assignedTo} and cannot be completed by you.`,
      });
    }

    const blocked = unmetDependencies(offboarding, task);
    if (blocked.length) {
      return res.status(409).json({
        success: false,
        message: `Blocked — required first: ${blocked.join(', ')}`,
      });
    }

    task.completed = true;
    task.completedAt = new Date();
    task.completedBy = req.user._id;

    await recalcAndSync(offboarding);

    res.status(200).json({ success: true, data: offboarding });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

// PATCH /api/offboarding/:employeeId/revoke-access — hr/admin/superuser ONLY (never manager)
// Deliberately independent of the checklist — access should not wait on paperwork.
exports.revokeAccess = async (req, res, next) => {
  try {
    const { employeeId } = req.params;

    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });

    const offboarding = await Offboarding.findOne({ employee: employeeId });
    if (!offboarding) return res.status(404).json({ success: false, message: 'Offboarding not found.' });

    if (offboarding.accessRevoked) {
      return res.status(409).json({ success: false, message: 'Access already revoked.' });
    }

    offboarding.accessRevoked = true;
    offboarding.accessRevokedAt = new Date();
    offboarding.accessRevokedBy = req.user._id;

    // Auto-complete any access_revocation tasks so the checklist stays consistent.
    offboarding.tasks.forEach((t) => {
      if (t.category === 'access_revocation' && !t.completed) {
        t.completed = true;
        t.completedAt = new Date();
        t.completedBy = req.user._id;
      }
    });

    await recalcAndSync(offboarding);

    // Immediately disable login — independent of task/checklist state.
    await User.findByIdAndUpdate(employee.user, { isActive: false });

    res.status(200).json({ success: true, data: offboarding });
  } catch (err) { next(err); }
};

// PATCH /api/offboarding/:employeeId/approve — hr/admin/superuser ONLY
exports.approveOffboarding = async (req, res, next) => {
  try {
    const { employeeId } = req.params;

    const offboarding = await Offboarding.findOne({ employee: employeeId });
    if (!offboarding) return res.status(404).json({ success: false, message: 'Offboarding not found.' });

    if (offboarding.phase === 'completed') {
      return res.status(409).json({ success: false, message: 'Offboarding already completed.' });
    }

    if (offboarding.progress !== 100) {
      return res.status(409).json({ success: false, message: 'Cannot finalize — checklist is not 100% complete.' });
    }

    if (!offboarding.accessRevoked) {
      return res.status(409).json({ success: false, message: 'Cannot finalize — system access has not been revoked.' });
    }

    offboarding.phase = 'completed';
    offboarding.approvedAt = new Date();
    offboarding.approvedBy = req.user._id;
    await offboarding.save();

    const employee = await Employee.findByIdAndUpdate(employeeId, { status: 'terminated', endDate: new Date() }, { new: true });
    
    const user = await User.findById(employee.user);
    user.terminate(offboarding.reason);

    user.isActive = false;
    await user.save({ validateBeforeSave: false });
    
    try {
      await dispatchNotification({
        recipient: user._id,
        channels: ['inApp', 'email'],
        type: 'account',
        title: 'Offboarding completed',
        message: 'Your offboarding process is complete and your account has been terminated.',
        email: user.email,
        priority: 'critical',
      });
    } catch (notifyErr) { console.error('Notify (offboarding-terminate) failed:', notifyErr); }
    

    res.status(200).json({ success: true, data: offboarding });
  } catch (err) { next(err); }
};
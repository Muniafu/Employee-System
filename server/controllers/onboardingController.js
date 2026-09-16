const Onboarding = require('../models/Onboarding');
const Employee = require('../models/Employee');
const { DEPARTMENT_ONBOARDING_TASKS, getDepartmentTasks } = require('../utils/departmentTaskTemplates');

const DEFAULT_TASKS = [
  { title: 'Sign employment contract', category: 'documentation', assignedTo: 'employee', required: true },
  { title: 'Setup company email & accounts', category: 'it_setup', assignedTo: 'it', required: true },
  { title: 'Complete GDPR/Data Protection training', category: 'training', assignedTo: 'employee', required: true },
  { title: 'Meet with team lead and buddy', category: 'meeting', assignedTo: 'manager', required: true },
  { title: 'Read employee handbook', category: 'policy', assignedTo: 'employee', required: true },
  { title: 'Set up payroll & bank details', category: 'documentation', assignedTo: 'employee', required: true },
  { title: 'Office/facility tour', category: 'meeting', assignedTo: 'hr', required: false },
];

/**
 * Decides whether the requesting user is allowed to complete a given task.
 * There is no dedicated "it" system role — IT-tagged tasks are handled by hr/admin/superuser.
 */
function canCompleteTask(task, userRole, isOwnRecord, isManagerOfRecord) {
  if (userRole === 'admin') return true;

  switch (task.assignedTo) {
    case 'employee':
      return isOwnRecord;
    case 'hr':
      return userRole === 'hr';
    case 'it':
      return userRole === 'hr'; // no dedicated IT role today
    case 'manager':
      return userRole === 'manager' && isManagerOfRecord;
    default:
      return false;
  }
}

exports.initiate = async (req, res, next) => {
  try {
    const { employeeId, startDate, buddy, hrContact } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });

    if (!['pending', 'onboarding'].includes(employee.status)) {
      return res.status(409).json({
        success: false,
        message: `Cannot initiate onboarding for an employee with status "${employee.status}".`,
      });
    }

    const existing = await Onboarding.findOne({ employee: employeeId });
    if (existing) return res.status(409).json({ success: false, message: 'Onboarding already initiated for this employee.' });

    const tasks = [
      ...DEFAULT_TASKS,
      ...getDepartmentTasks(DEPARTMENT_ONBOARDING_TASKS, employee.department),
    ];

    const onboarding = await Onboarding.create({
      employee: employeeId,
      startDate: startDate || new Date(),
      tasks,
      buddy,
      hrContact: hrContact || req.user._id,
    });

    if (employee.status !== 'onboarding') {
      employee.status = 'onboarding';
      await employee.save();
    }

    res.status(201).json({ success: true, data: onboarding });
  } catch (err) { next(err); }
};

exports.getMyOnboarding = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });
    const onboarding = await Onboarding.findOne({ employee: employee._id }).populate('buddy hrContact');
    if (!onboarding) return res.status(404).json({ success: false, message: 'No onboarding record found.' });
    res.status(200).json({ success: true, data: onboarding });
  } catch (err) { next(err); }
};

// GET /api/onboarding/all — HR/Admin/Superuser see everyone; manager sees only their direct reports
exports.getAll = async (req, res, next) => {
  try {
    let employeeFilter = {};

    if (req.user.role === 'manager') {
      employeeFilter = { manager: req.user._id };
    }

    let query = Onboarding.find();

    if (req.user.role === 'manager') {
      const managed = await Employee.find(employeeFilter).select('_id');
      query = Onboarding.find({ employee: { $in: managed.map(e => e._id) } });
    }

    const records = await query
      .populate({ path: 'employee', populate: { path: 'user', select: 'firstName lastName email' } })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: records.length, data: records });
  } catch (err) { next(err); }
};

exports.completeTask = async (req, res, next) => {
  try {
    const { taskId, employeeId: paramEmployeeId } = req.params;

    const requesterEmployee = await Employee.findOne({ user: req.user._id });

    let employeeRecordId = paramEmployeeId;
    let isOwnRecord = false;
    let targetEmployee;

    if (!employeeRecordId) {
      if (!requesterEmployee) return res.status(404).json({ success: false, message: 'Employee not found.' });
      employeeRecordId = requesterEmployee._id;
      isOwnRecord = true;
      targetEmployee = requesterEmployee;
    } else {
      isOwnRecord = requesterEmployee && String(requesterEmployee._id) === String(paramEmployeeId);
      targetEmployee = await Employee.findById(paramEmployeeId);
      if (!targetEmployee) return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    const isManagerOfRecord =
      targetEmployee?.manager && String(targetEmployee.manager) === String(req.user._id);

    const onboarding = await Onboarding.findOne({ employee: employeeRecordId });
    if (!onboarding) return res.status(404).json({ success: false, message: 'Onboarding not found.' });

    const task = onboarding.tasks.id(taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    if (task.completed) {
      return res.status(409).json({ success: false, message: 'Task already completed.' });
    }

    if (!canCompleteTask(task, req.user.role, isOwnRecord, isManagerOfRecord)) {
      return res.status(403).json({
        success: false,
        message: `This task is assigned to ${task.assignedTo} and cannot be completed by you.`,
      });
    }

    task.completed = true;
    task.completedAt = new Date();

    onboarding.progress = onboarding.calculateProgress();

    if (onboarding.progress === 100 && onboarding.phase !== 'completed') {
      onboarding.phase = 'completed';
      onboarding.completedAt = new Date();
      await Employee.findByIdAndUpdate(onboarding.employee, { status: 'active' });
    }

    await onboarding.save();
    res.status(200).json({ success: true, data: onboarding });
  } catch (err) { next(err); }
};
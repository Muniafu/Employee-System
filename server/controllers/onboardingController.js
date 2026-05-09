const Onboarding = require('../models/Onboarding');
const Employee = require('../models/Employee');

const DEFAULT_TASKS = [
  { title: 'Sign employment contract', category: 'documentation', assignedTo: 'employee', required: true },
  { title: 'Setup company email & accounts', category: 'it_setup', assignedTo: 'it', required: true },
  { title: 'Complete GDPR/Data Protection training', category: 'training', assignedTo: 'employee', required: true },
  { title: 'Meet with team lead and buddy', category: 'meeting', assignedTo: 'manager', required: true },
  { title: 'Read employee handbook', category: 'policy', assignedTo: 'employee', required: true },
  { title: 'Set up payroll & bank details', category: 'documentation', assignedTo: 'employee', required: true },
  { title: 'Office/facility tour', category: 'meeting', assignedTo: 'hr', required: false },
];

exports.initiate = async (req, res, next) => {
  try {
    const { employeeId, startDate, buddy, hrContact } = req.body;
    const existing = await Onboarding.findOne({ employee: employeeId });
    if (existing) return res.status(409).json({ success: false, message: 'Onboarding already initiated for this employee.' });

    const onboarding = await Onboarding.create({
      employee: employeeId,
      startDate: startDate || new Date(),
      tasks: DEFAULT_TASKS,
      buddy, hrContact: hrContact || req.user._id,
    });
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

exports.getAll = async (req, res, next) => {
  try {
    const records = await Onboarding.find()
      .populate({ path: 'employee', populate: { path: 'user', select: 'firstName lastName email' } })
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: records.length, data: records });
  } catch (err) { next(err); }
};

exports.completeTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const employee = await Employee.findOne({ user: req.user._id });
    const onboarding = await Onboarding.findOne({ employee: employee?._id });
    if (!onboarding) return res.status(404).json({ success: false, message: 'Onboarding not found.' });

    const task = onboarding.tasks.id(taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
    task.completed = true;
    task.completedAt = new Date();

    onboarding.progress = onboarding.calculateProgress();
    if (onboarding.progress === 100) { onboarding.phase = 'completed'; onboarding.completedAt = new Date(); }

    await onboarding.save();
    res.status(200).json({ success: true, data: onboarding });
  } catch (err) { next(err); }
};
const CareerPath = require('../models/CareerPath');
const Employee = require('../models/Employee');

exports.create = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found.' });

    const existing = await CareerPath.findOne({ employee: employee._id, status: 'active' });
    if (existing) return res.status(409).json({ success: false, message: 'An active career path already exists. Update or pause it first.' });

    const path = await CareerPath.create({ ...req.body, employee: employee._id });
    res.status(201).json({ success: true, data: path });
  } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'employee') {
      const emp = await Employee.findOne({ user: req.user._id });
      if (emp) filter.employee = emp._id;
    }
    if (req.query.status) filter.status = req.query.status;
    if (req.query.successionFlag) filter.successionFlag = req.query.successionFlag === 'true';

    const paths = await CareerPath.find(filter)
      .populate({ path: 'employee', populate: { path: 'user', select: 'firstName lastName email' } })
      .populate('mentor', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: paths.length, data: paths });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const path = await CareerPath.findById(req.params.id)
      .populate({ path: 'employee', populate: { path: 'user', select: 'firstName lastName email' } })
      .populate('mentor', 'firstName lastName email');
    if (!path) return res.status(404).json({ success: false, message: 'Career path not found.' });
    res.status(200).json({ success: true, data: path });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const path = await CareerPath.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!path) return res.status(404).json({ success: false, message: 'Career path not found.' });
    res.status(200).json({ success: true, data: path });
  } catch (err) { next(err); }
};

exports.completeMilestone = async (req, res, next) => {
  try {
    const { milestoneId } = req.params;
    const careerPath = await CareerPath.findById(req.params.id);
    if (!careerPath) return res.status(404).json({ success: false, message: 'Career path not found.' });

    const milestone = careerPath.milestones.id(milestoneId);
    if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found.' });

    milestone.completed = true;
    milestone.completedAt = new Date();
    await careerPath.save();

    res.status(200).json({ success: true, data: careerPath });
  } catch (err) { next(err); }
};

exports.flagSuccession = async (req, res, next) => {
  try {
    const path = await CareerPath.findByIdAndUpdate(req.params.id, { successionFlag: true, approvedBy: req.user._id }, { new: true });
    if (!path) return res.status(404).json({ success: false, message: 'Career path not found.' });
    res.status(200).json({ success: true, message: 'Employee flagged as succession candidate.', data: path });
  } catch (err) { next(err); }
};
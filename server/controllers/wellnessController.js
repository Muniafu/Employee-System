const Wellness = require('../models/Wellness');
const Employee = require('../models/Employee');

exports.create = async (req, res, next) => {
  try {
    const program = await Wellness.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: program });
  } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.type) filter.type = req.query.type;
    const programs = await Wellness.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: programs.length, data: programs });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const program = await Wellness.findById(req.params.id);
    if (!program) return res.status(404).json({ success: false, message: 'Wellness program not found.' });
    res.status(200).json({ success: true, data: program });
  } catch (err) { next(err); }
};

exports.enroll = async (req, res, next) => {
  try {
    const program = await Wellness.findById(req.params.id);
    if (!program) return res.status(404).json({ success: false, message: 'Program not found.' });
    if (!program.isActive) return res.status(400).json({ success: false, message: 'Program is not active.' });

    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });

    const already = program.enrollments.find(e => e.employee?.toString() === employee._id.toString());
    if (already) return res.status(409).json({ success: false, message: 'Already enrolled.' });

    if (program.enrollments.length >= program.maxCapacity) {
      return res.status(400).json({ success: false, message: 'Program is at full capacity.' });
    }

    program.enrollments.push({ employee: employee._id });
    await program.save();
    res.status(200).json({ success: true, message: 'Enrolled in wellness program.', data: program });
  } catch (err) { next(err); }
};

exports.complete = async (req, res, next) => {
  try {
    const program = await Wellness.findById(req.params.id);
    if (!program) return res.status(404).json({ success: false, message: 'Program not found.' });

    const employee = await Employee.findOne({ user: req.user._id });
    const enrollment = program.enrollments.find(e => e.employee?.toString() === employee?._id.toString());
    if (!enrollment) return res.status(400).json({ success: false, message: 'Not enrolled.' });

    enrollment.status = 'completed';
    enrollment.completedAt = new Date();
    enrollment.feedback = req.body.feedback || '';
    await program.save();
    res.status(200).json({ success: true, message: 'Program completed.', data: enrollment });
  } catch (err) { next(err); }
};
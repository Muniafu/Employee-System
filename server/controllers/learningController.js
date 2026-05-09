const Learning = require('../models/Learning');
const Employee = require('../models/Employee');

exports.create = async (req, res, next) => {
  try {
    const course = await Learning.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: course });
  } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.mandatory) filter.isMandatory = req.query.mandatory === 'true';
    const courses = await Learning.find(filter).populate('createdBy', 'firstName lastName').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: courses.length, data: courses });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const course = await Learning.findById(req.params.id).populate('createdBy', 'firstName lastName');
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
    res.status(200).json({ success: true, data: course });
  } catch (err) { next(err); }
};

exports.enroll = async (req, res, next) => {
  try {
    const course = await Learning.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });

    const already = course.enrollments.find(e => e.employee?.toString() === employee._id.toString());
    if (already) return res.status(409).json({ success: false, message: 'Already enrolled in this course.' });

    course.enrollments.push({ employee: employee._id, status: 'enrolled' });
    await course.save();
    res.status(200).json({ success: true, message: 'Enrolled successfully.', data: course });
  } catch (err) { next(err); }
};

exports.updateProgress = async (req, res, next) => {
  try {
    const course = await Learning.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

    const employee = await Employee.findOne({ user: req.user._id });
    const enrollment = course.enrollments.find(e => e.employee?.toString() === employee?._id.toString());
    if (!enrollment) return res.status(400).json({ success: false, message: 'Not enrolled in this course.' });

    enrollment.progress = req.body.progress;
    if (req.body.progress >= 100) {
      enrollment.status = 'completed';
      enrollment.completedAt = new Date();
      enrollment.score = req.body.score || course.passingScore;
      if ((req.body.score || course.passingScore) >= course.passingScore) {
        enrollment.certificate = `CERT-${course._id}-${employee._id}-${Date.now()}`;
      }
    } else {
      enrollment.status = 'in_progress';
    }
    await course.save();
    res.status(200).json({ success: true, data: enrollment });
  } catch (err) { next(err); }
};

exports.getMyCourses = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });

    const courses = await Learning.find({ 'enrollments.employee': employee._id });
    const withStatus = courses.map(c => {
      const enrollment = c.enrollments.find(e => e.employee?.toString() === employee._id.toString());
      return { ...c.toObject(), myEnrollment: enrollment };
    });
    res.status(200).json({ success: true, count: withStatus.length, data: withStatus });
  } catch (err) { next(err); }
};
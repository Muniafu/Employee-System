const Compliance = require('../models/Compliance');
const Employee = require('../models/Employee');

exports.create = async (req, res, next) => {
  try {
    const item = await Compliance.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.query.type) filter.type = req.query.type;
    if (req.query.mandatory) filter.isMandatory = req.query.mandatory === 'true';

    const items = await Compliance.find(filter)
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const item = await Compliance.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Compliance item not found.' });
    res.status(200).json({ success: true, data: item });
  } catch (err) { next(err); }
};

exports.acknowledge = async (req, res, next) => {
  try {
    const item = await Compliance.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Compliance item not found.' });

    const employee = await Employee.findOne({ user: req.user._id });
    const already = item.acknowledgments.find(a => a.employee?.toString() === employee?._id.toString());
    if (already) return res.status(409).json({ success: false, message: 'Already acknowledged.' });

    item.acknowledgments.push({
      employee: employee?._id,
      ipAddress: req.ip || '',
      signature: req.body.signature || `${req.user.firstName} ${req.user.lastName}`,
    });
    await item.save();

    res.status(200).json({ success: true, message: 'Acknowledged successfully.', data: { acknowledgedAt: new Date() } });
  } catch (err) { next(err); }
};

exports.getAcknowledgmentStatus = async (req, res, next) => {
  try {
    const item = await Compliance.findById(req.params.id)
      .populate('acknowledgments.employee', 'department position')
      .populate({ path: 'acknowledgments.employee', populate: { path: 'user', select: 'firstName lastName email' } });
    if (!item) return res.status(404).json({ success: false, message: 'Compliance item not found.' });

    const totalEmployees = await Employee.countDocuments({ status: 'active' });
    const acknowledged = item.acknowledgments.length;
    const pending = totalEmployees - acknowledged;

    res.status(200).json({
      success: true,
      data: {
        title: item.title,
        totalEmployees,
        acknowledged,
        pending,
        completionRate: totalEmployees > 0 ? `${((acknowledged / totalEmployees) * 100).toFixed(1)}%` : '0%',
        acknowledgments: item.acknowledgments,
      },
    });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const item = await Compliance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Compliance item not found.' });
    res.status(200).json({ success: true, data: item });
  } catch (err) { next(err); }
};
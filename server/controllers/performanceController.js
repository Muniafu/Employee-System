const Performance = require('../models/Performance');
const Employee = require('../models/Employee');

// POST /api/performance
exports.create = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });

    const { period, reviewType, goals, selfRating, strengths, improvements } = req.body;
    const existing = await Performance.findOne({ employee: employee._id, period });
    if (existing) return res.status(409).json({ success: false, message: `Performance review for ${period} already exists.` });

    const review = await Performance.create({ employee: employee._id, period, reviewType: reviewType || 'quarterly', goals: goals || [], selfRating, strengths, improvements, status: 'draft' });
    res.status(201).json({ success: true, data: review });
  } catch (err) { next(err); }
};

// GET /api/performance
exports.getAll = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'employee') {
      const emp = await Employee.findOne({ user: req.user._id });
      if (emp) filter.employee = emp._id;
    }
    if (req.query.period) filter.period = req.query.period;
    if (req.query.status) filter.status = req.query.status;

    const reviews = await Performance.find(filter)
      .populate({ path: 'employee', populate: { path: 'user', select: 'firstName lastName email' } })
      .populate('reviewer', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (err) { next(err); }
};

// GET /api/performance/:id
exports.getOne = async (req, res, next) => {
  try {
    const review = await Performance.findById(req.params.id)
      .populate({ path: 'employee', populate: { path: 'user', select: 'firstName lastName email' } })
      .populate('reviewer', 'firstName lastName');
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });
    res.status(200).json({ success: true, data: review });
  } catch (err) { next(err); }
};

// PATCH /api/performance/:id/submit
exports.submit = async (req, res, next) => {
  try {
    const review = await Performance.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });
    review.status = 'submitted';
    review.submittedAt = new Date();
    if (req.body.selfRating) review.selfRating = req.body.selfRating;
    if (req.body.goals) review.goals = req.body.goals;
    await review.save();
    res.status(200).json({ success: true, data: review });
  } catch (err) { next(err); }
};

// PATCH /api/performance/:id/review — manager/admin
exports.review = async (req, res, next) => {
  try {
    const perf = await Performance.findById(req.params.id);
    if (!perf) return res.status(404).json({ success: false, message: 'Review not found.' });
    const { managerRating, managerComment, overallRating } = req.body;
    perf.managerRating = managerRating;
    perf.managerComment = managerComment || '';
    perf.overallRating = overallRating || managerRating;
    perf.reviewer = req.user._id;
    perf.status = 'reviewed';
    perf.reviewedAt = new Date();
    await perf.save();
    res.status(200).json({ success: true, data: perf });
  } catch (err) { next(err); }
};

// PUT /api/performance/:id/goals
exports.updateGoals = async (req, res, next) => {
  try {
    const review = await Performance.findByIdAndUpdate(req.params.id, { goals: req.body.goals }, { new: true });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });
    res.status(200).json({ success: true, data: review });
  } catch (err) { next(err); }
};
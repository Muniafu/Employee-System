const Engagement = require('../models/Engagement');
const Employee = require('../models/Employee');

exports.create = async (req, res, next) => {
  try {
    const survey = await Engagement.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: survey });
  } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.active) filter.isActive = req.query.active === 'true';
    const surveys = await Engagement.find(filter).populate('createdBy', 'firstName lastName').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: surveys.length, data: surveys });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const survey = await Engagement.findById(req.params.id);
    if (!survey) return res.status(404).json({ success: false, message: 'Survey not found.' });
    res.status(200).json({ success: true, data: survey });
  } catch (err) { next(err); }
};

exports.submit = async (req, res, next) => {
  try {
    const survey = await Engagement.findById(req.params.id);
    if (!survey) return res.status(404).json({ success: false, message: 'Survey not found.' });
    if (!survey.isActive) return res.status(400).json({ success: false, message: 'Survey is no longer active.' });

    const employee = await Employee.findOne({ user: req.user._id });
    const alreadySubmitted = survey.responses.find(r => r.employee?.toString() === employee?._id.toString() && !survey.anonymous);
    if (alreadySubmitted) return res.status(409).json({ success: false, message: 'Already submitted response to this survey.' });

    const { answers, npsScore, anonymous } = req.body;
    survey.responses.push({ employee: anonymous ? null : employee?._id, answers: answers || [], npsScore, anonymous: !!anonymous });

    // Recalculate avg NPS
    const npsResponses = survey.responses.filter(r => r.npsScore !== undefined);
    survey.avgNps = npsResponses.length ? (npsResponses.reduce((s, r) => s + r.npsScore, 0) / npsResponses.length) : 0;

    await survey.save();
    res.status(200).json({ success: true, message: 'Response submitted.', data: { responseCount: survey.responses.length } });
  } catch (err) { next(err); }
};

exports.getResults = async (req, res, next) => {
  try {
    const survey = await Engagement.findById(req.params.id);
    if (!survey) return res.status(404).json({ success: false, message: 'Survey not found.' });

    const total = survey.responses.length;
    const avgNps = survey.avgNps;
    const ratingsByQuestion = {};

    survey.questions.forEach((q, i) => {
      const ratings = survey.responses.map(r => r.answers?.[i]?.rating).filter(Boolean);
      ratingsByQuestion[q.text] = ratings.length ? (ratings.reduce((s, n) => s + n, 0) / ratings.length).toFixed(2) : null;
    });

    res.status(200).json({ success: true, data: { title: survey.title, total, avgNps, ratingsByQuestion } });
  } catch (err) { next(err); }
};
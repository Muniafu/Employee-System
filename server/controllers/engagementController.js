const Engagement = require('../models/Engagement');

// ===========================
// Admin: Create Survey
// ===========================
exports.createSurvey = async (req, res, next) => {
  try {
    const survey = await Engagement.create({
      ...req.body,
      organizationId: req.user.organizationId
    });

    res.status(201).json({ success: true, data: survey });
  } catch (err) {
    next(err);
  }
};

// ===========================
// Get Active Surveys (Employee)
// ===========================
exports.getSurveys = async (req, res, next) => {
  try {
    const surveys = await Engagement.find({
      organizationId: req.user.organizationId,
      active: true
    }).select('title description questions');

    res.json({ success: true, data: surveys });
  } catch (err) {
    next(err);
  }
};

// ===========================
// Submit Survey (Employee)
// ===========================
exports.submitSurvey = async (req, res, next) => {
  try {
    const { surveyId, answers } = req.body;

    const survey = await Engagement.findOne({
      _id: surveyId,
      organizationId: req.user.organizationId,
      active: true
    });

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }

    const alreadySubmitted = survey.responses.find(
      r => r.employee.toString() === req.user._id.toString()
    );

    if (alreadySubmitted) {
      return res.status(400).json({
        success: false,
        message: 'Already submitted'
      });
    }

    survey.responses.push({
      employee: req.user._id,
      answers
    });

    await survey.save();

    res.json({
      success: true,
      message: 'Survey submitted'
    });

  } catch (err) {
    next(err);
  }
};

// ===========================
// Admin: Get Results
// ===========================
exports.getResults = async (req, res, next) => {
  try {
    const surveys = await Engagement.find({
      organizationId: req.user.organizationId
    });

    const results = surveys.map(s => {
      const summary = {};

      s.questions.forEach(q => {
        if (q.type === 'scale') {
          const values = s.responses.flatMap(r =>
            r.answers
              .filter(a => a.questionId === q.id)
              .map(a => a.value)
          );

          const avg = values.length
            ? values.reduce((a, b) => a + b, 0) / values.length
            : 0;

          summary[q.id] = {
            question: q.text,
            average: avg,
            responses: values.length
          };
        }
      });

      return {
        surveyId: s._id,
        title: s.title,
        summary
      };
    });

    res.json({ success: true, data: results });

  } catch (err) {
    next(err);
  }
};
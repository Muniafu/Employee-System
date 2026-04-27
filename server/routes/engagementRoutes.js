const express = require('express');
const router = express.Router();

const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

const {
  createSurvey,
  getSurveys,
  submitSurvey,
  getResults
} = require('../controllers/engagementController');

router.use(auth);

// Employee
router.get('/', authorize('employee'), getSurveys);
router.post('/', authorize('employee'), submitSurvey);

// Admin
router.post('/create', authorize('admin', 'employer'), createSurvey);
router.get('/results', authorize('admin', 'employer'), getResults);

module.exports = router;
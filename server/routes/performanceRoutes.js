const express = require('express');
const router = express.Router();

const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

const {
  createReview,
  updateReview,
  finalizeReview,
  getMyReviews,
  getByEmployee,
  getAll
} = require('../controllers/performanceController');

router.use(auth);

// Employee
router.get('/me', authorize('employee'), getMyReviews);

// Admin / Employer
router.get('/', authorize('admin', 'employer'), getAll);
router.get('/employee/:employeeId', authorize('admin', 'employer'), getByEmployee);

router.post('/', authorize('admin', 'employer'), createReview);
router.put('/:id', authorize('admin', 'employer'), updateReview);
router.patch('/:id/finalize', authorize('admin', 'employer'), finalizeReview);

module.exports = router;
const express = require('express');
const router = express.Router();

const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

const {
  getAll,
  getByEmployee,
  create,
  delete: deleteRecord
} = require('../controllers/onboardingController');

// All routes require authentication
router.use(auth);

// Admin & HR only can view all onboarding records
router.get('/', authorize('admin', 'hr'), getAll);

// Get onboarding by employee
router.get('/employee/:employeeId', authorize('admin', 'hr'), getByEmployee);

// Create onboarding or offboarding
router.post('/', authorize('admin', 'hr'), create);

// Delete record (admin only)
router.delete('/:id', authorize('admin'), deleteRecord);

module.exports = router;
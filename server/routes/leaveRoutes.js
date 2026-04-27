const express = require('express');
const router = express.Router();

const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

const {
  requestLeave,
  getMyLeaves,
  getAllLeaves,
  approveLeave,
  rejectLeave
} = require('../controllers/leaveController');

// Employee routes
router.post('/', auth, authorize('employee'), requestLeave);
router.get('/me', auth, authorize('employee'), getMyLeaves);

// Admin/Employer routes
router.get('/', auth, authorize('admin', 'employer'), getAllLeaves);
router.patch('/:id/approve', auth, authorize('admin', 'employer'), approveLeave);
router.patch('/:id/reject', auth, authorize('admin', 'employer'), rejectLeave);

module.exports = router;
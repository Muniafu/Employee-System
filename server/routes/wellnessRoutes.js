const express = require('express');
const router = express.Router();

const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

const {
  createProgram,
  getPrograms,
  enroll,
  getMyPrograms,
  getAllPrograms
} = require('../controllers/wellnessController');

router.use(auth);

// Employee
router.get('/', authorize('employee'), getPrograms);
router.post('/:programId/enroll', authorize('employee'), enroll);
router.get('/me', authorize('employee'), getMyPrograms);

// Admin / Employer
router.post('/', authorize('admin', 'employer'), createProgram);
router.get('/all', authorize('admin', 'employer'), getAllPrograms);

module.exports = router;
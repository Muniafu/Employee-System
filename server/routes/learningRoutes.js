const express = require('express');
const router = express.Router();

const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

const {
  createModule,
  getAllModules,
  enroll,
  updateProgress,
  getMyModules
} = require('../controllers/learningController');

router.use(auth);

// Employee
router.get('/me', authorize('employee'), getMyModules);
router.post('/:moduleId/enroll', authorize('employee'), enroll);
router.patch('/:moduleId/progress', authorize('employee'), updateProgress);

// Admin
router.get('/', authorize('admin', 'employer'), getAllModules);
router.post('/', authorize('admin', 'employer'), createModule);

module.exports = router;
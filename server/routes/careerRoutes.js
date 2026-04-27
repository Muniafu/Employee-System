const express = require('express');
const router = express.Router();

const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

const {
  createPath,
  getAllPaths,
  getByEmployee,
  getMyPath,
  updatePath
} = require('../controllers/careerController');

router.use(auth);

// Employee
router.get('/me', authorize('employee'), getMyPath);

// Admin
router.get('/', authorize('admin', 'employer'), getAllPaths);
router.get('/employee/:employeeId', authorize('admin', 'employer'), getByEmployee);
router.post('/', authorize('admin', 'employer'), createPath);
router.put('/:id', authorize('admin', 'employer'), updatePath);

module.exports = router;
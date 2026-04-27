const express = require('express');
const router = express.Router();

const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

const {
  dashboard,
  attendance,
  payroll
} = require('../controllers/analyticsController');

router.use(auth);

router.get('/dashboard', authorize('admin', 'employer'), dashboard);
router.get('/attendance', authorize('admin', 'employer'), attendance);
router.get('/payroll', authorize('admin', 'employer'), payroll);

module.exports = router;
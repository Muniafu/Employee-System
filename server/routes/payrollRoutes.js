const express = require('express');
const router = express.Router();

const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const { previewPayroll, finalizePayroll, getMyPayrolls, getAllPayrolls } = require('../controllers/payrollController');

router.post('/preview', auth, authorize('employer', 'admin'), previewPayroll);
router.post('/finalize', auth, authorize('employer', 'admin'), finalizePayroll);

router.get('/me', auth, authorize('employee'), getMyPayrolls);
router.get('/', auth, authorize('admin', 'employer'), getAllPayrolls);

module.exports = router;
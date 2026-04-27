const express = require('express');
const router = express.Router();

const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

const {
  getPolicies,
  acknowledgePolicy,
  getComplianceLogs
} = require('../controllers/complianceController');

// Employees
router.get('/', auth, getPolicies);
router.post('/:id/acknowledge', auth, authorize('employee'), acknowledgePolicy);

// Admin
router.get('/logs', auth, authorize('admin', 'employer'), getComplianceLogs);

module.exports = router;
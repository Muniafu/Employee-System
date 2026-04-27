const express = require('express');
const router = express.Router();

const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const { clockIn, clockOut, getMyAttendance, getAllAttendance, getByEmployee } = require('../controllers/attendanceController');

router.post('/clock-in', auth, authorize('employee'), clockIn);
router.post('/clock-out', auth, authorize('employee'), clockOut);
router.get('/me', auth, authorize('employee'), getMyAttendance);
router.get('/employee/:employeeId', auth, authorize('admin', 'employer'), getByEmployee);
router.get('/', auth, authorize('admin', 'employer'), getAllAttendance);

module.exports = router;
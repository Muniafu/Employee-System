const router = require('express').Router();
const c = require('../controllers/attendanceController');
const auth = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(auth);

router.post('/clock-in', c.clockIn);
router.post('/clock-out', c.clockOut);
router.get('/me', c.getMyAttendance);
router.get('/today', c.getToday);
router.get('/all', authorize('admin', 'superuser', 'hr', 'manager'), c.getAll);

module.exports = router;
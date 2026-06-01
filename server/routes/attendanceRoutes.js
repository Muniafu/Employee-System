const router =
  require('express').Router();

const c =
  require('../controllers/attendanceController');

const auth =
  require('../middleware/authMiddleware');

const {
  authorize,
} = require('../middleware/roleMiddleware');

const {
  requireEmployeeProfile,
} = require('../middleware/employeeMiddleware');

router.use(auth);

/**
 * EMPLOYEE ATTENDANCE
 */

router.post(
  '/clock-in',
  requireEmployeeProfile,
  c.clockIn
);

router.post(
  '/clock-out',
  requireEmployeeProfile,
  c.clockOut
);

router.get(
  '/me',
  requireEmployeeProfile,
  c.getMyAttendance
);

router.get(
  '/today',
  requireEmployeeProfile,
  c.getToday
);

/**
 * ADMIN GLOBAL VIEW
 */

router.get(
  '/all',
  authorize(
    'admin',
    'superuser',
    'hr',
    'manager'
  ),
  c.getAll
);

module.exports = router;
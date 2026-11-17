const router = require('express').Router();

const auth = require('../middleware/authMiddleware');

const {
  authorize,
} = require('../middleware/roleMiddleware');

const controller = require(
  '../controllers/payrollPeriodController'
);

/*
=====================================================
Authentication
=====================================================
*/

router.use(auth);

/*
=====================================================
Read
=====================================================
*/

router.get(
  '/',
  authorize(
    'admin',
    'hr'
  ),
  controller.getAllPeriods
);

router.get(
  '/:id',
  authorize(
    'admin',
    'hr'
  ),
  controller.getPeriod
);

/*
=====================================================
Create
=====================================================
*/

router.post(
  '/',
  authorize(
    'admin',
    'hr'
  ),
  controller.createPeriod
);

/*
=====================================================
Update
=====================================================
*/

router.put(
  '/:id',
  authorize(
    'admin',
    'hr'
  ),
  controller.updatePeriod
);

/*
=====================================================
Delete
=====================================================
*/

router.delete(
  '/:id',
  authorize(
  ),
  controller.deletePeriod
);

/*
=====================================================
Workflow
=====================================================
*/

router.patch(
  '/:id/attendance-lock',
  authorize(
    'admin',
    'hr'
  ),
  controller.lockAttendance
);

router.patch(
  '/:id/process',
  authorize(
    'admin',
    'hr'
  ),
  controller.startProcessing
);

router.patch(
  '/:id/approve',
  authorize(
    'admin',
  ),
  controller.approvePeriod
);

router.patch(
  '/:id/lock',
  authorize(
    'admin',
  ),
  controller.lockPayroll
);

router.patch(
  '/:id/pay',
  authorize(
    'admin',
  ),
  controller.markPaid
);

router.patch(
  '/:id/close',
  authorize(
    'admin',
  ),
  controller.closePeriod
);

module.exports = router;
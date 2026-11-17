const router = require('express').Router();

const auth = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const PayrollController = require('../controllers/payrollController');

router.use(auth);

/*
=====================================================
EMPLOYEE
=====================================================
*/

router.get(
    '/me',
    PayrollController.getMyPayroll
);

/*
=====================================================
PAYROLL GENERATION
=====================================================
*/

router.post(
    '/preview',
    authorize('admin', 'hr'),
    PayrollController.preview
);

router.patch(
    "/:id/reject",
    authorize("admin"),
    PayrollController.reject
);

router.post(
    '/generate',
    authorize('admin', 'hr'),
    PayrollController.finalize
);

router.post(
    '/bulk-generate',
    authorize('admin', 'hr'),
    PayrollController.bulkGenerate
);

/*
=====================================================
WORKFLOW
=====================================================
*/

router.patch(
    '/:id/review',
    authorize('admin', 'hr'),
    PayrollController.review
);

router.patch(
    '/:id/approve',
    authorize('admin'),
    PayrollController.approve
);

router.patch(
    '/:id/lock',
    authorize('admin'),
    PayrollController.lock
);

router.patch(
    '/:id/pay',
    authorize('admin'),
    PayrollController.markPaid
);

/*
=====================================================
REPORTS
=====================================================
*/

router.get(
    '/statistics',
    authorize('admin', 'hr'),
    PayrollController.statistics
);

/*
=====================================================
CRUD
=====================================================
*/

router.get(
    '/',
    authorize('admin', 'hr'),
    PayrollController.getAll
);

router.get(
    '/:id',
    authorize('admin', 'hr', 'employee'),
    PayrollController.getOne
);

router.delete(
    '/:id',
    authorize('admin'),
    PayrollController.remove
);

module.exports = router;
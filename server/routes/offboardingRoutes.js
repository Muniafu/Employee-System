const router = require('express').Router();
const c = require('../controllers/offboardingController');
const auth = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(auth);

router.post('/', authorize('admin', 'hr', 'manager'), c.initiate);

router.get('/me', c.getMyOffboarding);
router.get('/all', authorize('admin', 'hr', 'manager'), c.getAll);

// Self-service: employee completing their own assigned tasks
router.patch('/tasks/:taskId/complete', c.completeTask);

// HR/manager completing tasks on someone else's offboarding record
router.patch(
  '/:employeeId/tasks/:taskId/complete',
  authorize('admin', 'hr', 'manager'),
  c.completeTask
);

// Access revocation — deliberately excludes 'manager'
router.patch('/:employeeId/revoke-access', authorize('admin', 'hr'), c.revokeAccess);

// Final approval — deliberately excludes 'manager'
router.patch('/:employeeId/approve', authorize('admin', 'hr'), c.approveOffboarding);

module.exports = router;
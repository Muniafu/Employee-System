const router = require('express').Router();
const c = require('../controllers/onboardingController');
const auth = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(auth);

router.post('/', authorize('admin', 'hr'), c.initiate);
router.get('/me', c.getMyOnboarding);
router.get('/all', authorize('admin', 'hr'), c.getAll);

// Self-service: employee completing their own assigned tasks
router.patch(
  '/tasks/:taskId/complete',
  authorize('admin', 'hr', 'manager', 'employee'),
  c.completeTask
);

// HR/IT/manager completing tasks on someone else's onboarding record
router.patch(
  '/:employeeId/tasks/:taskId/complete',
  authorize('admin', 'hr', 'manager'),
  c.completeTask
);

module.exports = router;
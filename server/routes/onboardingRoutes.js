const router = require('express').Router();
const c = require('../controllers/onboardingController');
const auth = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(auth);

router.post('/', authorize('admin', 'superuser', 'hr'), c.initiate);
router.get('/me', c.getMyOnboarding);
router.get('/all', authorize('admin', 'superuser', 'hr'), c.getAll);
router.patch('/tasks/:taskId/complete', c.completeTask);

module.exports = router;
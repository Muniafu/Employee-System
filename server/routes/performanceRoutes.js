const router = require('express').Router();
const c = require('../controllers/performanceController');
const auth = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(auth);

router.post('/', c.create);
router.get('/', c.getAll);
router.get('/:id', c.getOne);
router.patch('/:id/submit', c.submit);
router.patch('/:id/review', authorize('admin', 'superuser', 'hr', 'manager'), c.review);
router.put('/:id/goals', c.updateGoals);

module.exports = router;
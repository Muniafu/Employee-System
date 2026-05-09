const router = require('express').Router();
const c = require('../controllers/engagementController');
const auth = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(auth);

router.post('/', authorize('admin', 'superuser', 'hr'), c.create);
router.get('/', c.getAll);
router.get('/:id', c.getOne);
router.post('/:id/submit', c.submit);
router.get('/:id/results', authorize('admin', 'superuser', 'hr'), c.getResults);

module.exports = router;
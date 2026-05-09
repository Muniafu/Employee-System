const router = require('express').Router();
const c = require('../controllers/wellnessController');
const auth = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(auth);

router.post('/', authorize('admin', 'superuser', 'hr'), c.create);
router.get('/', c.getAll);
router.get('/:id', c.getOne);
router.post('/:id/enroll', c.enroll);
router.patch('/:id/complete', c.complete);

module.exports = router;
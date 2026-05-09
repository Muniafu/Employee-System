const router = require('express').Router();
const c = require('../controllers/complianceController');
const auth = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(auth);

router.post('/', authorize('admin', 'superuser', 'hr'), c.create);
router.get('/', c.getAll);
router.get('/:id', c.getOne);
router.post('/:id/acknowledge', c.acknowledge);
router.get('/:id/status', authorize('admin', 'superuser', 'hr'), c.getAcknowledgmentStatus);
router.put('/:id', authorize('admin', 'superuser', 'hr'), c.update);

module.exports = router;
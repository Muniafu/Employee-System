const router = require('express').Router();
const c = require('../controllers/complianceController');
const auth = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(auth);

router.post('/', authorize('admin', 'hr'), c.create);
router.get('/', c.getAll);
router.get('/:id', c.getOne);
router.post('/:id/acknowledge', c.acknowledge);
router.get('/:id/status', authorize('admin', 'hr'), c.getAcknowledgmentStatus);
router.put('/:id', authorize('admin', 'hr'), c.update);

module.exports = router;
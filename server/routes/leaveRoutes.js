const router = require('express').Router();
const c = require('../controllers/leaveController');
const auth = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(auth);

router.post('/', c.apply);
router.get('/', c.getAll);
router.get('/on-leave', c.getOnLeave);
router.patch('/:id/approve', authorize('admin', 'superuser', 'hr', 'manager'), c.approve);
router.patch('/:id/reject', authorize('admin', 'superuser', 'hr', 'manager'), c.reject);
router.delete('/:id/cancel', c.cancel);

module.exports = router;
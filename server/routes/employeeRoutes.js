const router = require('express').Router();
const c = require('../controllers/employeeController');
const auth = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(auth);

router.get('/me', c.getMyProfile);
router.get('/', authorize('admin', 'hr', 'manager'), c.getAll);
router.get('/:id', c.getOne);
router.put('/:id', c.update);
router.patch('/:id/deactivate', authorize('admin', 'hr'), c.deactivate);
router.delete('/:id', authorize('admin'), c.remove);

module.exports = router;
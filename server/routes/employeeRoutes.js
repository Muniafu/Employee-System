const router = require('express').Router();
const c = require('../controllers/employeeController');
const auth = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(auth);

router.get('/me', c.getMyProfile);
router.get('/', authorize('admin', 'superuser', 'hr', 'manager'), c.getAll);
router.get('/:id', c.getOne);
router.put('/:id', c.update);
router.patch('/:id/deactivate', authorize('admin', 'superuser', 'hr'), c.deactivate);
router.delete('/:id', authorize('superuser'), c.remove);

module.exports = router;
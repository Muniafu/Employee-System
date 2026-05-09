const router = require('express').Router();
const c = require('../controllers/payrollController');
const auth = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(auth);

router.get('/me', c.getMyPayroll);
router.post('/preview', authorize('admin', 'superuser', 'hr'), c.preview);
router.post('/finalize', authorize('admin', 'superuser', 'hr'), c.finalize);
router.get('/all', authorize('admin', 'superuser', 'hr'), c.getAll);
router.get('/:id', c.getOne);

module.exports = router;
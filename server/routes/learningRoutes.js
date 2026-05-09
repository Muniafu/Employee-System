const router = require('express').Router();
const c = require('../controllers/learningController');
const auth = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(auth);

router.post('/', authorize('admin', 'superuser', 'hr'), c.create);
router.get('/', c.getAll);
router.get('/my-courses', c.getMyCourses);
router.get('/:id', c.getOne);
router.post('/:id/enroll', c.enroll);
router.patch('/:id/progress', c.updateProgress);

module.exports = router;
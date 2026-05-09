const router = require('express').Router();
const c = require('../controllers/careerController');
const auth = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(auth);

router.post('/', c.create);
router.get('/', c.getAll);
router.get('/:id', c.getOne);
router.put('/:id', c.update);
router.patch('/:id/milestones/:milestoneId/complete', c.completeMilestone);
router.patch('/:id/flag-succession', authorize('admin', 'superuser', 'hr'), c.flagSuccession);

module.exports = router;
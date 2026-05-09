const router = require('express').Router();
const c = require('../controllers/analyticsController');
const auth = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(auth, authorize('admin', 'superuser', 'hr'));

router.get('/dashboard', c.dashboard);
router.get('/attendance', c.attendance);
router.get('/payroll', c.payroll);
router.get('/headcount', c.headcount);
router.get('/leave', c.leave);
router.get('/turnover', c.turnover);

module.exports = router;
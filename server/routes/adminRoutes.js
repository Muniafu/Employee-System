const router = require('express').Router();
const c = require('../controllers/adminController');
const auth = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(auth);

// Dashboard
router.get('/dashboard', authorize('admin', 'superuser', 'hr'), c.summary);
router.get('/audit', authorize('admin', 'superuser'), c.auditLog);

// Users
router.get('/users', authorize('admin', 'superuser', 'hr'), c.getAllUsers);
router.patch('/users/:id/role', authorize('admin', 'superuser'), c.changeRole);
router.patch('/users/:id/toggle-active', authorize('admin', 'superuser'), c.toggleActive);

// Departments
router.get('/departments', c.getDepartments);
router.post('/departments', authorize('admin', 'superuser'), c.createDepartment);
router.put('/departments/:id', authorize('admin', 'superuser'), c.updateDepartment);

// Policies
router.get('/policies', c.getPolicies);
router.post('/policies', authorize('admin', 'superuser', 'hr'), c.createPolicy);

module.exports = router;
const router = require('express').Router();

const c =
  require('../controllers/adminController');

const auth =
  require('../middleware/authMiddleware');

const {
  authorize,
} = require('../middleware/roleMiddleware');

router.use(auth);

// Dashboard
router.get(
  '/dashboard',
  authorize(
    'admin',
    'hr'
  ),
  c.summary
);

router.get(
  '/audit',
  authorize(
    'admin',
  ),
  c.auditLog
);

// Users
router.get(
  '/users',
  authorize(
    'admin',
    'hr'
  ),
  c.getAllUsers
);

router.patch(
  '/users/:id/approve',
  authorize(
    'admin',
    'hr'
  ),
  c.approveUser
);

router.patch(
  '/users/:id/reject',
  authorize(
    'admin',
    'hr'
  ),
  c.rejectUser
);

router.patch(
  '/users/:id/suspend',
  authorize(
    'admin',
  ),
  c.suspendUser
);

router.patch(
  '/users/:id/terminate',
  authorize(
    'admin',
  ),
  c.terminateUser
);

router.patch(
  '/users/:id/reinstate',
  authorize(
    'admin',
  ),
  c.reinstateUser
);

router.patch(
  '/users/:id/role',
  authorize(
    'admin',
  ),
  c.changeRole
);

router.patch(
  '/users/:id/reactivate', 
  authorize('admin',
  ),
  c.reactivateUser);

router.patch(
  '/users/:id/toggle-active',
  authorize(
    'admin',
  ),
  c.toggleActive
);

// Departments
router.get(
  '/departments',
  c.getDepartments
);

router.post(
  '/departments',
  authorize(
    'admin',
  ),
  c.createDepartment
);

router.put(
  '/departments/:id',
  authorize(
    'admin',
  ),
  c.updateDepartment
);

// Policies
router.get(
  '/policies',
  c.getPolicies
);

router.post(
  '/policies',
  authorize(
    'admin',
    'hr'
  ),
  c.createPolicy
);

module.exports = router;
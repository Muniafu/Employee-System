const express = require('express');
const router = express.Router();

const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

const {
  createUser,
  getUsers,
  updateUserRole,
  deactivateUser
} = require('../controllers/adminController');

router.use(auth);
router.use(authorize('admin', 'superadmin'));

router.post('/users', createUser);
router.get('/users', getUsers);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/deactivate', deactivateUser);

module.exports = router;
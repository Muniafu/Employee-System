const express = require('express');
const router = express.Router();

const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

const { 
    getEmployees, 
    getEmployeeById, 
    getMyProfile, 
    createEmployee, 
    updateEmployee, 
    deleteEmployee 
} = require('../controllers/employeeController');


// GET current user profile
router.get('/me', auth, getMyProfile);

// GET all employees (Admin/employer only)
router.get(
    '/', 
    auth, 
    authorize('admin', 'employer'), 
    getEmployees
);

// GET single employee
router.get(
    '/:id',
    auth,
    authorize('admin', 'employer'),
    getEmployeeById
);

// CREATE employee
router.post(
    '/',
    auth,
    authorize('admin', 'employer'),
    createEmployee
);

// UPDATE employee
router.put(
    '/:id',
    auth,
    authorize('admin', 'employer'),
    updateEmployee
);

// DELETE employee
router.delete(
    '/:id',
    auth,
    authorize('admin'),
    deleteEmployee
);

module.exports = router;
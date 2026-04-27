const Employee = require('../models/Employee');
const ROLES = require('../utils/roles');

// GET ALL EMPLOYEES (Admin / Employer)
exports.getEmployees = async (req, res) => {
    try {
        const employees = await Employee.find().select('-password').populate('department', 'name');

        res.json({
            success: true,
            data: employees
        });
    } catch (err) {
        next(err);
    }
};

// GET SINGLE EMPLOYEE BY ID
exports.getEmployeeById = async (req, res, next) => {
    try {
        const employee = await Employee.findById(req.params.id).select('-password').populate('department', 'name');

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        res.json({
            success: true,
            data: employee
        });
    } catch (err) {
        next(err);
    }
};

// GET CURRENT LOGGED-IN USER PROFILE
exports.getMyProfile = async (req, res, next) => {
    try {
        const user = await Employee.findById(req.user._id).select('-password').populate('department', 'name');

        res.json({
            success: true,
            data: user
        });
    } catch (err) {
        next(err);
    }
};

// CREATE EMPLOYEE (Admin / Employee)
exports.createEmployee = async (req, res, next) => {
    try {
        const employee = await Employee.create(req.body);

        res.status(201).json({
            success: true,
            message: 'Employee created successfully',
            data: employee
        });
    } catch (err) {
        next(err);
    }
};

// UPDATE EMPLOYEE
exports.updateEmployee = async (req, res, next) => {
    try {
        const employee = await Employee.findById(req.params.id);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        Object.assign(employee, req.body);
        await employee.save();

        res.json({
            success: true,
            message: 'Employee updated successfully',
            data: employee
        });
    } catch (err) {
        next(err);
    }
};

// DELETE EMPLOYEE
exports.deleteEmployee = async (req, res, next) => {
    try {
        const employee = await Employee.findById(req.params.id);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        await employee.deleteOne();

        res.json({
            success: true,
            message: 'Employee deleted successfully'
        });
    } catch (err) {
        next(err);
    }
};
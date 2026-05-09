const User = require('../models/User');
const Employee = require('../models/Employee');

// GET /api/employees
exports.getAll = async (req, res, next) => {
  try {
    const { search, department, status, role, page = 1, limit = 20 } = req.query;
    const userFilter = {};
    const empFilter = {};

    if (search) userFilter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
    if (role) userFilter.role = role;
    if (department) empFilter.department = { $regex: department, $options: 'i' };
    if (status) empFilter.status = status;

    const users = Object.keys(userFilter).length ? await User.find(userFilter).select('_id') : null;
    if (users) empFilter.user = { $in: users.map(u => u._id) };

    const total = await Employee.countDocuments(empFilter);
    const employees = await Employee.find(empFilter)
      .populate('user', 'firstName lastName email role isActive lastLogin')
      .populate('manager', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json({ success: true, count: employees.length, total, page: parseInt(page), data: employees });
  } catch (err) { next(err); }
};

// GET /api/employees/:id
exports.getOne = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('user', 'firstName lastName email role isActive lastLogin')
      .populate('manager', 'firstName lastName email');
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });

    // Employees can only see own record
    if (req.user.role === 'employee' && employee.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    res.status(200).json({ success: true, data: employee });
  } catch (err) { next(err); }
};

// GET /api/employees/me
exports.getMyProfile = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id })
      .populate('user', 'firstName lastName email role isActive lastLogin')
      .populate('manager', 'firstName lastName email');
    if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found.' });
    res.status(200).json({ success: true, data: employee });
  } catch (err) { next(err); }
};

// PUT /api/employees/:id
exports.update = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });

    const isSelf = employee.user.toString() === req.user._id.toString();
    const isPriv = ['admin', 'superuser', 'hr'].includes(req.user.role);
    if (!isSelf && !isPriv) return res.status(403).json({ success: false, message: 'Access denied.' });

    // Strip salary changes for non-admin
    if (req.user.role === 'employee') delete req.body.salary;

    const restricted = ['user', 'employeeId'];
    restricted.forEach(f => delete req.body[f]);

    const updated = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('user', 'firstName lastName email role');
    res.status(200).json({ success: true, data: updated });
  } catch (err) { next(err); }
};

// DELETE /api/employees/:id — superuser only
exports.remove = async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });
    await User.findByIdAndDelete(employee.user);
    res.status(200).json({ success: true, message: 'Employee permanently deleted.' });
  } catch (err) { next(err); }
};

// PATCH /api/employees/:id/deactivate
exports.deactivate = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });
    employee.status = 'terminated';
    await employee.save();
    await User.findByIdAndUpdate(employee.user, { isActive: false });
    res.status(200).json({ success: true, message: 'Employee deactivated.' });
  } catch (err) { next(err); }
};
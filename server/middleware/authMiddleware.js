const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const Employee = require('../models/Employee');

module.exports = async (req, res, next) => {
    try {
        const auth = req.headers.authorization;
        if (!auth || !auth.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const token = auth.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        const user = await Employee.findById(decoded.id).select('-password');
        if (!user || user.status !== 'active') {
            return res.status(401).json({ success: false, message: 'Account inactive' });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};
const Employee = require('../models/Employee');
const { generateToken } = require('../utils/token');

// Login
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await Employee.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const match = await user.comparePassword(password);
        if (!match) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (user.status !== 'active') {
            return res.status(403).json({ success: false, message: 'Account inactive' });
        }

        const token = generateToken(user);

        res.json({
            success: true,
            mesage: 'Login successful',
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    role: user.role,
                }
            }
        });
    } catch (err) {
        next(err);
    }
};
const { verifyToken } =
  require('../utils/token');

const User =
  require('../models/User');

const Employee =
  require('../models/Employee');

const auth = async (
  req,
  res,
  next
) => {
  const header =
    req.headers.authorization;

  if (
    !header ||
    !header.startsWith('Bearer ')
  ) {
    return res.status(401).json({
      success: false,
      message:
        'No token provided. Access denied.',
    });
  }

  const token =
    header.split(' ')[1];

  try {
    const decoded =
      verifyToken(token);

    const user =
      await User.findById(
        decoded.id
      ).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          'User no longer exists.',
      });
    }

    const employeeProfile =
      await Employee.findOne({
        user: user._id,
      }).select('_id');

    req.user = {
      ...user.toObject(),

      hasEmployeeProfile:
        !!employeeProfile,

      employeeId:
        employeeProfile?._id || null,
    };

    next();

  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
  }
};

module.exports = auth;
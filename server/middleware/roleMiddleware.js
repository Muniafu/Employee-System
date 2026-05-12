const { ROLE_HIERARCHY } = require('../utils/roles');
const {  ROLE_PERMISSIONS } = require('../utils/permissions');

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden.',
      });
    }

    next();
  };
};

const authorizeMin = (minRole) => {
  return (req, res, next) => {
    const userLevel =
      ROLE_HIERARCHY[req.user.role] || 0;

    const requiredLevel =
      ROLE_HIERARCHY[minRole] || 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient role level.',
      });
    }

    next();
  };
};

const authorizePermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated.',
      });
    }

    const userPermissions =
      ROLE_PERMISSIONS[req.user.role] || [];

    const allowed = permissions.every(
      permission =>
        userPermissions.includes(permission)
    );

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied.',
      });
    }

    next();
  };
};

module.exports = {
  authorize,
  authorizeMin,
  authorizePermission,
};
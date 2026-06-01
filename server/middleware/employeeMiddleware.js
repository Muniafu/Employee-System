const Employee =
  require('../models/Employee');

exports.requireEmployeeProfile =
  async (req, res, next) => {
    try {

      if (
        !req.user.hasEmployeeProfile
      ) {
        return res.status(403).json({
          success: false,
          message:
            'Employee profile required.',
        });
      }

      const employee =
        await Employee.findById(
          req.user.employeeId
        );

      if (!employee) {
        return res.status(404).json({
          success: false,
          message:
            'Employee profile missing.',
        });
      }

      req.employee = employee;

      next();

    } catch (err) {
      next(err);
    }
  };
const cron = require('node-cron');

const Offboarding = require('../models/Offboarding');
const Employee = require('../models/Employee');
const User = require('../models/User');

const logger = require('../utils/logger');
const { getIO } = require('../socket/socketManager');

const emitOffboardingUpdate = (employeeId, event) => {
  try {
    const io = getIO();
    if (io) io.emit(event, { employee: employeeId });
  } catch (err) {
    // socket errors must never break the job
  }
};

/**
 * Runs daily. Finds any offboarding record whose lastWorkingDay has
 * passed (or is today) but whose access has not yet been revoked,
 * and revokes it automatically — independent of task checklist
 * completion, matching the manual revokeAccess() behavior.
 */
const runAccessRevocationSweep = async () => {
  const now = new Date();

  const due = await Offboarding.find({
    lastWorkingDay: { $lte: now },
    accessRevoked: false,
    phase: { $ne: 'completed' },
  });

  for (const offboarding of due) {
    try {
      offboarding.accessRevoked = true;
      offboarding.accessRevokedAt = new Date();
      // accessRevokedBy intentionally left unset — system-triggered, not a user action

      const accessTask = offboarding.tasks.find(t => t.category === 'access_revocation');
      if (accessTask && !accessTask.completed) {
        accessTask.completed = true;
        accessTask.completedAt = new Date();
      }

      offboarding.progress = offboarding.calculateProgress();
      await offboarding.save();

      const employee = await Employee.findById(offboarding.employee);
      if (employee) {
        await User.findByIdAndUpdate(employee.user, { isActive: false });
      }

      emitOffboardingUpdate(offboarding.employee, 'offboarding:access_revoked');

      logger.info(`Auto-revoked access for employee ${offboarding.employee} (last working day passed).`);
    } catch (err) {
      logger.error(`Failed to auto-revoke access for offboarding ${offboarding._id}: ${err.message}`);
      // continue to next record rather than aborting the whole sweep
    }
  }
};

/**
 * Runs daily at 00:15 Kenya time.
 */
const start = () => {
  cron.schedule('15 0 * * *', runAccessRevocationSweep, {
    timezone: 'Africa/Nairobi',
  });

  logger.info('Offboarding access-revocation scheduler started.');
};

module.exports = { start, runAccessRevocationSweep };
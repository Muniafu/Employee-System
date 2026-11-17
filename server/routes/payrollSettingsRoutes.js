const router = require('express').Router();

const auth = require('../middleware/authMiddleware');

const {
  authorize,
} = require('../middleware/roleMiddleware');

const controller = require(
  '../controllers/payrollSettingsController'
);

router.use(auth);

router.get(
  '/',
  authorize(
    'admin',
    'hr'
  ),
  controller.getSettings
);

router.post(
  '/',
  authorize(
    'admin',
  ),
  controller.createSettings
);

router.put(
  '/:id',
  authorize(
    'admin',
  ),
  controller.updateSettings
);

router.patch(
  '/:id/activate',
  authorize(
    'admin',
  ),
  controller.activateSettings
);

router.patch(
  '/:id/deactivate',
  authorize(
    'admin',
  ),
  controller.deactivateSettings
);

router.delete(
  '/:id',
  authorize('admin'),
  controller.deleteSettings
);

module.exports = router;
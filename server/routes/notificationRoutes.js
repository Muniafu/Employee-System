const router =
  require('express').Router();

const c =
  require('../controllers/notificationController');

const auth =
  require('../middleware/authMiddleware');

router.use(auth);

/**
 * DISABLE CACHE
 */
router.use((req, res, next) => {
  res.set(
    'Cache-Control',
    'no-store'
  );

  next();
});

router.get('/', c.getAll);

router.get(
  '/unread-count',
  c.getUnreadCount
);

router.patch(
  '/read-all',
  c.markAllRead
);

router.patch(
  '/:id/read',
  c.markAsRead
);

router.delete(
  '/:id',
  c.remove
);

router.patch(
  '/:id/archive',
  c.archive
);

module.exports = router;
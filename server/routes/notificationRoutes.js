const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { getMyNotifications, markAsRead } = require('../controllers/notificationController');

// @route   GET /api/notifications/me
// @desc    Get my notifications
// @access  Private
router.get('/me', auth, getMyNotifications);
router.patch('/:id/read', auth, markAsRead);

module.exports = router;
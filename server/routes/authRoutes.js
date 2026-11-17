const router = require('express').Router();

const {
   register,
   login,
   getMe,
   changePassword,
   registerAdmin,
   forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
} = require('../controllers/authController');

const auth = require('../middleware/authMiddleware');

const {
  authorize,
} = require('../middleware/roleMiddleware');

const {
  authLimiter,
} = require('../middleware/rateLimiter');

const passport = require('../config/passport');

const providers = ['google', 'microsoft', 'facebook', 'linkedin', 'github'];

providers.forEach((provider) => {
  if (!passport._strategies[provider]) return; // Skip if the strategy is not registered  

  router.get(`/${provider}`, passport.authenticate(provider, { session: false }));
  router.get(
    `/${provider}/callback`,
    passport.authenticate(provider, { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=social` }),
    require('../controllers/authController').socialCallback
  );
});

router.post('/confirm-link/:token', require('../controllers/authController').confirmLink);

router.post('/register', authLimiter, register);

router.post('/login', authLimiter, login);

router.get('/me', auth, getMe);

router.put('/change-password', auth, changePassword);

router.post(
  '/register-admin',
  auth,
  authorize('admin'),
  registerAdmin
);

router.post(
    "/forgot-password",
    authLimiter,
    forgotPassword
);

router.post(
    "/reset-password/:token",
    authLimiter,
    resetPassword
);

router.get('/verify-email/:token', verifyEmail);

router.post('/resend-verification', authLimiter, resendVerification);

module.exports = router;
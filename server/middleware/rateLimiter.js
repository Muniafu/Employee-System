const reteLimit = require('express-rate-limit');

exports.authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        mesage: 'Too many attempts. try again later.'
    }
});

exports.apiLimiter = rateLimit({
    windoMs: 1 * 60 * 1000,
    max: 100
});
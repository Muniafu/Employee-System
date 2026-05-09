const logger = require('../utils/logger');

const errorMiddleware = (err, req, res, next) => {

  logger.error(`${req.method} ${req.originalUrl} → ${err.message}`);

  // Prevent double-response crash
  if (res.headersSent) {
    return next(err);
  }

  // Validation
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(
      (e) => e.message
    );

    return res.status(422).json({
      success: false,
      message: 'Validation failed.',
      errors: messages,
    });
  }

  // Duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];

    return res.status(409).json({
      success: false,
      message: `Duplicate value for ${field}`,
    });
  }

  // Invalid ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}`,
    });
  }

  // JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired.',
    });
  }

  // Multer
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large.',
    });
  }

  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
    }),
  });
};

module.exports = errorMiddleware;
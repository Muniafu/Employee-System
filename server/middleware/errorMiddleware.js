// Generic Express error-handling middleware
function errorMiddleware(err, req, res, next) {
  // Log the error for debugging
  console.error(err);

  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Server Error';

  res.status(status).json({
    success: false,
    message
  });
}

module.exports = errorMiddleware;

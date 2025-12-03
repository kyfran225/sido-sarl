import logger from '../config/logger.js';

/**
 * Middleware to handle 404 Not Found errors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.status = 404;
  next(error);
};

/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const errorHandler = (err, req, res) => {
  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Log the error
  logger.error({
    err: err,
    status: statusCode,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  }, 'Error occurred');

  // Don't leak error details in production
  const isProduction = process.env.NODE_ENV === 'production';
  const errorResponse = {
    success: false,
    error: {
      message: isProduction && statusCode === 500 ? 'Internal Server Error' : message,
      ...(isProduction ? {} : { stack: err.stack })
    }
  };

  res.status(statusCode).json(errorResponse);
};

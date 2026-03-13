/**
 * Custom Error Response Class
 */
class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Global error handler middleware
 * Formats and sends error responses
 */
exports.errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error(`Error: ${err.message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ErrorResponse(message, 400);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `Duplicate field value: ${field} with value: ${value}. Please use another value.`;
    error = new ErrorResponse(message, 400);
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new ErrorResponse(message, 404);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new ErrorResponse('Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new ErrorResponse('Token expired', 401);
  }

  // Default error response
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Not Found middleware
 * Handles requests to non-existent routes
 */
exports.notFound = (req, res, next) => {
  const error = new ErrorResponse(`Not found - ${req.originalUrl}`, 404);
  next(error);
};

/**
 * Async Handler to avoid try-catch blocks in controllers
 * Wraps async functions to handle errors
 */
exports.asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Error Response utility for creating custom errors
 */
exports.ErrorResponse = ErrorResponse; 
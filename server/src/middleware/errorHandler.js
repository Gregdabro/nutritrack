const logger = require('../logger');
const { AppError } = require('../errors/AppError');

function errorHandler(err, req, res, _next) {
  if (err.name === 'CastError') {
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: 'Resource not found',
    });
  }

  if (err.code === 11000) {
    logger.warn({ path: req.path, method: req.method }, 'Duplicate key error');
    return res.status(409).json({
      error: 'ALREADY_EXISTS',
      message: 'Запись уже существует',
    });
  }

  if (err instanceof AppError) {
    logger.warn(
      { code: err.code, statusCode: err.statusCode, method: req.method, path: req.path },
      err.message,
    );
    return res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
    });
  }

  logger.error({ err, method: req.method, path: req.path }, 'Unhandled error');
  return res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'Something went wrong',
  });
}

module.exports = errorHandler;

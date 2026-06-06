const logger = require('../logger');
const { AppError } = require('../errors/AppError');

function errorHandler(err, req, res, _next) {
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

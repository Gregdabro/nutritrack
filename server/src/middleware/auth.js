const jwt = require('jsonwebtoken');
const { AuthenticationError } = require('../errors/AppError');

function auth(req, _res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(new AuthenticationError('Missing or invalid authorization header'));
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: payload.userId, telegramId: payload.telegramId };
    next();
  } catch {
    next(new AuthenticationError('Invalid or expired token'));
  }
}

module.exports = auth;

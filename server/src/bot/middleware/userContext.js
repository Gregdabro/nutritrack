const User = require('../../models/User');
const logger = require('../../logger');

async function userContext(ctx, next) {
  if (!ctx.from) return next();

  const telegramId = String(ctx.from.id);
  let user = await User.findOne({ telegramId });

  if (!user) {
    user = await User.create({
      telegramId,
      firstName: ctx.from.first_name || 'User',
      lastName: ctx.from.last_name,
      username: ctx.from.username,
    });
    logger.info({ userId: user._id.toString() }, 'New user created via bot');
  }

  ctx.user = user;
  return next();
}

module.exports = userContext;

const { Telegraf } = require('telegraf');
const logger = require('../logger');
const userContext = require('./middleware/userContext');
const { startHandler, handleOnboarding } = require('./handlers/start');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(userContext);

bot.start(startHandler);

bot.on('text', async (ctx) => {
  const user = ctx.user;
  if (user && user.botState !== 'idle') {
    return handleOnboarding(ctx);
  }
});

module.exports = bot;

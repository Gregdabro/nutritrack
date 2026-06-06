const { Telegraf } = require('telegraf');
const logger = require('../logger');
const userContext = require('./middleware/userContext');
const { startHandler, handleOnboarding } = require('./handlers/start');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(userContext);

bot.start(startHandler);

bot.on('text', async (ctx) => {
  const user = ctx.user;
  // Онбординг: состояние не-idle (шаги), ИЛИ idle но без weightKg (ещё не проходил настройку)
  if (user && (user.botState !== 'idle' || !user.weightKg)) {
    return handleOnboarding(ctx);
  }
});

module.exports = bot;

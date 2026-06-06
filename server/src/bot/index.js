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

  // Обработка кнопок меню
  const text = ctx.message?.text;
  if (text === '📊 Прогресс сегодня') {
    return ctx.reply('📊 Раздел прогресса будет доступен в следующем обновлении.');
  }
  if (text === '⚙️ Цели') {
    return ctx.reply(
      '⚙️ Твои цели можно настроить в веб-приложении:\n\n' +
      `${process.env.WEBAPP_URL || 'https://nutritrack-topaz.vercel.app'}/settings`
    );
  }
});

module.exports = bot;

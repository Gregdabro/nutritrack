const { Telegraf } = require('telegraf');
const logger = require('../logger');
const userContext = require('./middleware/userContext');
const { startHandler, handleOnboarding } = require('./handlers/start');
const { createLoginToken } = require('../routes/auth');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(userContext);

bot.start(startHandler);

// Команда /login — генерирует одноразовую ссылку для входа в веб
bot.command('login', async (ctx) => {
  const user = ctx.user;
  if (!user) return;

  const rawToken = createLoginToken(user);
  const webappUrl = process.env.WEBAPP_URL || 'https://nutritrack-topaz.vercel.app';
  const loginUrl = `${webappUrl}/login/token?t=${rawToken}`;

  logger.info({ userId: user._id.toString() }, 'Login token generated');
  ctx.reply(
    `🔑 Ссылка для входа (действует 5 минут):\n\n${loginUrl}\n\nНажми на ссылку чтобы войти в веб-приложение.`,
    { disable_web_page_preview: true },
  );
});

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

const { Telegraf } = require('telegraf');
const logger = require('../logger');
const userContext = require('./middleware/userContext');
const { startHandler, handleOnboarding } = require('./handlers/start');
const { createLoginToken } = require('../routes/auth');
const foodHandler  = require('./handlers/food');
const todayHandler = require('./handlers/today');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(userContext);

bot.start(startHandler);

// Команда /today — прогресс за день
bot.command('today', todayHandler);

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

// Обработчики callback-кнопок
bot.action('manual_entry', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    const webappUrl = process.env.WEBAPP_URL || 'https://nutritrack-topaz.vercel.app';
    await ctx.reply(`Для ручного ввода продуктов используй веб-приложение:\n${webappUrl}/diary`);
  } catch (err) {
    logger.error({ err }, 'Error answering manual_entry callback query');
  }
});

bot.action('retry_parse', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    await ctx.reply('Попробуй ввести описание еды ещё раз. Например:\n"яйцо 3 шт, огурец 100г"');
  } catch (err) {
    logger.error({ err }, 'Error answering retry_parse callback query');
  }
});

bot.action('add_food', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    await ctx.reply('Просто напиши мне в чат, что ты съел, например:\n"съел 3 яйца и 150г гречки"');
  } catch (err) {
    logger.error({ err }, 'Error answering add_food callback query');
  }
});

bot.action('log_weight', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    await ctx.reply('Ввод веса будет доступен в следующем обновлении (Спринт 5).');
  } catch (err) {
    logger.error({ err }, 'Error answering log_weight callback query');
  }
});


// bot.on('text') — должен быть зарегистрирован ПОСЛЕ всех команд
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

  // Свободный текст → парсинг еды через AI
  return foodHandler(ctx);
});

module.exports = bot;

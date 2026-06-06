const { Markup } = require('telegraf');
const User = require('../../models/User');
const Goal = require('../../models/Goal');
const logger = require('../../logger');

const DEFAULT_GOALS = {
  protein: 100,
  fat: 100,
  carbs: 200,
  fiber: 30,
  calories: 2100,
  water: 2000,
};

async function startHandler(ctx) {
  const user = ctx.user;

  // Повторный /start — пользователь уже проходил онбординг
  if (user.botState === 'idle' && user.weightKg) {
    return ctx.reply(
      `С возвращением, ${user.firstName}! Используй кнопки ниже.`,
      Markup.keyboard([
        ['📊 Прогресс сегодня'],
        ['⚙️ Цели'],
      ]).resize(),
    );
  }

  // Новый пользователь или онбординг не завершён — начинаем с начала
  if (user.botState === 'idle' || !user.weightKg) {
    return ctx.reply(
      `Привет, ${user.firstName}! Я NutriTrack — помогу отслеживать питание, тренировки и самочувствие.\n\nДавай настроим твои цели. Это займёт 2 минуты.`,
      Markup.keyboard([
        ['Начать настройку'],
        ['Пропустить, настрою потом'],
      ]).resize(),
    );
  }

  // Fallback
  return ctx.reply(
    `С возвращением, ${user.firstName}! Используй кнопки ниже.`,
    Markup.keyboard([
      ['📊 Прогресс сегодня'],
      ['⚙️ Цели'],
    ]).resize(),
  );
}

async function handleOnboarding(ctx) {
  const user = ctx.user;
  const text = ctx.message?.text;

  if (!text) return;

  // ---- Шаг: выбор "Начать настройку" или "Пропустить" ----
  if (user.botState === 'idle') {
    if (text === 'Начать настройку') {
      await User.updateOne(
        { _id: user._id },
        { botState: 'onboarding_weight' },
      );
      return ctx.reply('Сколько ты весишь? (введи цифру в кг, например: 82)');
    }

    if (text === 'Пропустить, настрою потом') {
      await saveDefaultGoals(user._id);
      await User.updateOne(
        { _id: user._id },
        { botState: 'idle', botStateData: null },
      );
      return ctx.reply(
        'Хорошо! Просто пиши мне что ты съел, и я всё запишу.\nНапример: \'съел 3 яйца и 150г гречки\'',
        Markup.removeKeyboard(),
      );
    }

    return; // неизвестный текст в idle — игнорируем
  }

  // ---- Шаг: вес ----
  if (user.botState === 'onboarding_weight') {
    const weight = parseFloat(text);
    if (!weight || weight < 20 || weight > 300) {
      return ctx.reply('Введи корректный вес в кг (число от 20 до 300). Например: 82');
    }
    await User.updateOne(
      { _id: user._id },
      { weightKg: weight, botState: 'onboarding_height', botStateData: { weight } },
    );
    return ctx.reply('Отлично! Рост? (например: 178)');
  }

  // ---- Шаг: рост ----
  if (user.botState === 'onboarding_height') {
    const height = parseFloat(text);
    if (!height || height < 50 || height > 260) {
      return ctx.reply('Введи корректный рост в см (число от 50 до 260). Например: 178');
    }
    await User.updateOne(
      { _id: user._id },
      { heightCm: height, botState: 'onboarding_confirm' },
    );
    return ctx.reply(
      'На основе твоих данных предлагаю стартовые цели:\n\n' +
      '• Белки: 100г/день\n' +
      '• Жиры: 100г/день\n' +
      '• Углеводы: 200г/день\n' +
      '• Клетчатка: 30г/день\n' +
      '• Калории: ~2100 ккал\n\n' +
      'Всё верно?',
      Markup.keyboard([
        ['Принять ✅'],
        ['Пропустить'],
      ]).resize(),
    );
  }

  // ---- Шаг: подтверждение целей ----
  if (user.botState === 'onboarding_confirm') {
    if (text === 'Принять ✅') {
      await saveDefaultGoals(user._id);
      await User.updateOne(
        { _id: user._id },
        { botState: 'idle', botStateData: null },
      );
      logger.info({ userId: user._id.toString() }, 'Onboarding completed');
      return ctx.reply(
        'Настройка завершена! Просто пиши мне что ты съел, и я всё запишу.\nНапример: \'съел 3 яйца и 150г гречки\'',
        Markup.removeKeyboard(),
      );
    }

    if (text === 'Пропустить') {
      await saveDefaultGoals(user._id);
      await User.updateOne(
        { _id: user._id },
        { botState: 'idle', botStateData: null },
      );
      return ctx.reply(
        'Хорошо! Просто пиши мне что ты съел, и я всё запишу.\nНапример: \'съел 3 яйца и 150г гречки\'',
        Markup.removeKeyboard(),
      );
    }

    return ctx.reply('Нажми "Принять ✅" или "Пропустить".');
  }
}

async function saveDefaultGoals(userId) {
  await Goal.findOneAndUpdate(
    { userId },
    { ...DEFAULT_GOALS },
    { upsert: true },
  );
}

module.exports = { startHandler, handleOnboarding };

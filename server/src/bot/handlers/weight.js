const User = require('../../models/User');
const WeightLog = require('../../models/WeightLog');
const logger = require('../../logger');

async function handleWeightCommand(ctx) {
  const text = ctx.message.text.trim();
  const parts = text.split(/\s+/);

  // If command is just "/weight", ask for value
  if (parts.length === 1) {
    await User.updateOne({ _id: ctx.user._id }, { botState: 'awaiting_weight' });
    return ctx.reply('Введи свой текущий вес в кг (например, 82.4):', {
      reply_markup: {
        force_reply: true,
      }
    });
  }

  // If command is "/weight 82.4", parse it
  const weightStr = parts[1].replace(',', '.');
  const weightKg = parseFloat(weightStr);

  if (isNaN(weightKg) || weightKg < 20 || weightKg > 300) {
    return ctx.reply('Пожалуйста, введи корректный вес в кг (от 20 до 300).');
  }

  await saveWeight(ctx, weightKg);
}

async function handleWeightInput(ctx) {
  const text = ctx.message.text.trim();
  const weightStr = text.replace(',', '.');
  const weightKg = parseFloat(weightStr);

  if (isNaN(weightKg) || weightKg < 20 || weightKg > 300) {
    return ctx.reply('Пожалуйста, введи корректный вес в кг (от 20 до 300).');
  }

  await saveWeight(ctx, weightKg);
}

async function saveWeight(ctx, weightKg) {
  try {
    const user = ctx.user;
    const date = new Date().toISOString().split('T')[0];

    await WeightLog.findOneAndUpdate(
      { userId: user._id, date },
      { weightKg, loggedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Update user's profile weight too
    await User.updateOne(
      { _id: user._id },
      { botState: 'idle', botStateData: null, weightKg }
    );

    await ctx.reply(`⚖️ Вес записан: ${weightKg} кг`);
  } catch (err) {
    logger.error({ err }, 'Error saving weight log');
    await User.updateOne({ _id: ctx.user._id }, { botState: 'idle', botStateData: null });
    await ctx.reply('Произошла ошибка при сохранении веса.');
  }
}

module.exports = {
  handleWeightCommand,
  handleWeightInput,
};

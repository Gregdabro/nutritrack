const User = require('../../models/User');
const Goal = require('../../models/Goal');
const logger = require('../../logger');

async function goalsHandler(ctx) {
  try {
    const telegramId = ctx.from.id.toString();
    const user = await User.findOne({ telegramId }).lean();
    if (!user) return;

    const goal = await Goal.findOne({ userId: user._id }).lean();
    if (!goal) {
      await ctx.reply('Цели пока не настроены. Пожалуйста, зайдите в приложение и настройте их в разделе Настройки.');
      return;
    }

    const msg = `🎯 Текущие цели на день:
Калории: ${goal.calories || 2100} ккал
Белки: ${goal.protein || 100} г
Жиры: ${goal.fat || 100} г
Углеводы: ${goal.carbs || 200} г
Клетчатка: ${goal.fiber || 30} г
Вода: ${goal.water || 2000} мл
${goal.weeklyBudget ? `Бюджет в неделю: ${goal.weeklyBudget} €` : ''}
`;
    await ctx.reply(msg);
  } catch (err) {
    logger.error(err, 'Error in goalsHandler');
    await ctx.reply('Произошла ошибка при получении целей.');
  }
}

module.exports = goalsHandler;

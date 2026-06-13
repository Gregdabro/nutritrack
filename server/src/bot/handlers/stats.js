const User = require('../../models/User');
const Goal = require('../../models/Goal');
const FoodLog = require('../../models/FoodLog');
const { progressBar } = require('../utils');

async function statsHandler(ctx) {
  try {
    const telegramId = ctx.from.id.toString();
    const user = await User.findOne({ telegramId }).lean();
    if (!user) return;

    // Last 7 days
    const dates = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dStr = new Intl.DateTimeFormat('sv-SE', { timeZone: user.timezone || 'Europe/Rome' }).format(d);
      dates.push(dStr);
    }
    
    const [goal, foodLogs] = await Promise.all([
      Goal.findOne({ userId: user._id }).lean(),
      FoodLog.find({ userId: user._id, date: { $in: dates } }).lean()
    ]);

    const g = goal || { protein: 100, fat: 100, carbs: 200, calories: 2100 };
    
    let totalCalories = 0, totalCost = 0;
    const daysWithFood = new Set();

    for (const log of foodLogs) {
      daysWithFood.add(log.date);
      if (log.totals) {
        totalCalories += log.totals.calories || 0;
        totalCost += log.totals.costEur || 0;
      }
    }

    const count = daysWithFood.size;
    if (count === 0) {
      await ctx.reply('За последние 7 дней нет записей о еде.');
      return;
    }

    const avgCalories = Math.round(totalCalories / count);

    const msg = `📊 Сводка за последние 7 дней:
Дней с записями: ${count}
Средние калории: ${avgCalories} / ${g.calories} ккал
${totalCost > 0 ? `Потрачено на еду: ${totalCost.toFixed(2)} €` : ''}
`;
    await ctx.reply(msg);

  } catch (err) {
    console.error('Error in statsHandler:', err);
    await ctx.reply('Произошла ошибка при получении статистики.');
  }
}

module.exports = statsHandler;

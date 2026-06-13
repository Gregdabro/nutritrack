const User = require('../../models/User');
const FoodLog = require('../../models/FoodLog');

async function repeatHandler(ctx) {
  try {
    const telegramId = ctx.from.id.toString();
    const user = await User.findOne({ telegramId }).lean();
    if (!user) return;

    // Get today's and yesterday's date
    const now = new Date();
    const tz = user.timezone || 'Europe/Rome';
    const todayStr = new Intl.DateTimeFormat('sv-SE', { timeZone: tz }).format(now);
    
    const yesterdayObj = new Date(now.getTime() - 86400000);
    const yesterdayStr = new Intl.DateTimeFormat('sv-SE', { timeZone: tz }).format(yesterdayObj);

    // Determine current meal type roughly by hour
    const hourStr = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', hour12: false }).format(now);
    const hour = parseInt(hourStr, 10);
    
    let currentMealType = 'snack';
    if (hour >= 6 && hour < 11) currentMealType = 'breakfast';
    else if (hour >= 11 && hour < 16) currentMealType = 'lunch';
    else if (hour >= 16 && hour < 22) currentMealType = 'dinner';

    // Find yesterday's log for the same meal type
    const yesterdayLogs = await FoodLog.find({ userId: user._id, date: yesterdayStr, mealType: currentMealType }).lean();
    
    if (!yesterdayLogs || yesterdayLogs.length === 0) {
      await ctx.reply(`Не удалось найти записи за вчера для приёма пищи: ${currentMealType}`);
      return;
    }

    // Duplicate all items from yesterday's meal
    for (const log of yesterdayLogs) {
      const newLog = new FoodLog({
        userId: user._id,
        date: todayStr,
        mealType: currentMealType,
        textInput: log.textInput,
        items: log.items,
        totals: log.totals,
        loggedAt: new Date()
      });
      await newLog.save();
    }

    await ctx.reply(`✅ Вчерашний ${currentMealType} успешно скопирован на сегодня!`);
  } catch (err) {
    console.error('Error in repeatHandler:', err);
    await ctx.reply('Произошла ошибка при повторении приёма пищи.');
  }
}

module.exports = repeatHandler;

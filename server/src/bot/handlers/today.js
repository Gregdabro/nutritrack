const { Markup } = require('telegraf');
const FoodLog = require('../../models/FoodLog');
const Goal = require('../../models/Goal');
const logger = require('../../logger');
const { getTodayDate, progressBar } = require('../utils');

/**
 * Format a date for human display (e.g. "31 мая")
 */
function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

/**
 * Get sum of all FoodLog totals for a user on a given date.
 */
async function getDayTotals(userId, date) {
  const logs = await FoodLog.find({ userId, date }).lean();
  if (!logs.length) {
    return { protein: 0, fat: 0, carbs: 0, fiber: 0, calories: 0 };
  }
  return logs.reduce(
    (acc, log) => {
      const t = log.totals || {};
      return {
        protein:  parseFloat(((acc.protein  || 0) + (t.protein  || 0)).toFixed(1)),
        fat:      parseFloat(((acc.fat      || 0) + (t.fat      || 0)).toFixed(1)),
        carbs:    parseFloat(((acc.carbs    || 0) + (t.carbs    || 0)).toFixed(1)),
        fiber:    parseFloat(((acc.fiber    || 0) + (t.fiber    || 0)).toFixed(1)),
        calories: parseFloat(((acc.calories || 0) + (t.calories || 0)).toFixed(0)),
      };
    },
    { protein: 0, fat: 0, carbs: 0, fiber: 0, calories: 0 },
  );
}

/**
 * /today command handler — shows the user's daily progress summary.
 */
async function todayHandler(ctx) {
  const user = ctx.user;
  if (!user) return;

  const today = getTodayDate();

  const [dayTotals, goal] = await Promise.all([
    getDayTotals(user._id, today),
    Goal.findOne({ userId: user._id }).lean(),
  ]);

  const g = goal || { protein: 100, fat: 100, carbs: 200, fiber: 30, calories: 2100 };

  const pct = (cur, target) =>
    target > 0 ? Math.round((cur / target) * 100) : 0;

  const message =
    `📅 Сегодня, ${formatDate(today)}\n\n` +
    `🍽 Питание:\n` +
    `Белки:    ${progressBar(dayTotals.protein, g.protein)} ${dayTotals.protein}г / ${g.protein}г  (${pct(dayTotals.protein, g.protein)}%)\n` +
    `Жиры:     ${progressBar(dayTotals.fat, g.fat)} ${dayTotals.fat}г / ${g.fat}г  (${pct(dayTotals.fat, g.fat)}%)\n` +
    `Углеводы: ${progressBar(dayTotals.carbs, g.carbs)} ${dayTotals.carbs}г / ${g.carbs}г  (${pct(dayTotals.carbs, g.carbs)}%)\n` +
    `Клетчатка:${progressBar(dayTotals.fiber, g.fiber)} ${dayTotals.fiber}г / ${g.fiber}г  (${pct(dayTotals.fiber, g.fiber)}%)\n` +
    `Калории:  ${dayTotals.calories} / ${g.calories} ккал`;

  logger.info({ userId: user._id.toString(), date: today }, '/today command executed');

  return ctx.reply(
    message,
    Markup.inlineKeyboard([
      [
        Markup.button.callback('🍽 Добавить еду', 'add_food'),
        Markup.button.callback('⚖️ Взвеситься', 'log_weight'),
      ],
    ]),
  );
}

module.exports = todayHandler;

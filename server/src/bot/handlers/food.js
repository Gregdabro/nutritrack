const { Markup } = require('telegraf');
const FoodLog = require('../../models/FoodLog');
const Product = require('../../models/Product');
const Goal = require('../../models/Goal');
const aiParser = require('../../services/aiParser');
const { calcItemNutrients, calcTotals } = require('../../services/nutritionCalc');
const logger = require('../../logger');
const { getTodayDate, progressBar } = require('../utils');

/**
 * Detect meal type from free-form Russian text.
 * @param {string} text
 * @returns {'breakfast'|'lunch'|'dinner'|'snack'}
 */
function detectMealType(text) {
  const lower = text.toLowerCase();
  if (/завтрак|утром|на завтра\b/.test(lower)) return 'breakfast';
  if (/обед|в обед|на обед/.test(lower))        return 'lunch';
  if (/ужин|на ужин|вечером/.test(lower))        return 'dinner';
  return 'snack';
}

/**
 * Get sum of all FoodLog totals for a user on a given date.
 */
async function getDayTotals(userId, date) {
  const logs = await FoodLog.find({ userId, date }).lean();
  if (!logs.length) {
    return { protein: 0, fat: 0, carbs: 0, fiber: 0, calories: 0, costEur: 0 };
  }
  const zero = { protein: 0, fat: 0, carbs: 0, fiber: 0, calories: 0, costEur: 0 };
  return logs.reduce((acc, log) => {
    const t = log.totals || {};
    return {
      protein:  parseFloat(((acc.protein  || 0) + (t.protein  || 0)).toFixed(1)),
      fat:      parseFloat(((acc.fat      || 0) + (t.fat      || 0)).toFixed(1)),
      carbs:    parseFloat(((acc.carbs    || 0) + (t.carbs    || 0)).toFixed(1)),
      fiber:    parseFloat(((acc.fiber    || 0) + (t.fiber    || 0)).toFixed(1)),
      calories: parseFloat(((acc.calories || 0) + (t.calories || 0)).toFixed(0)),
      costEur: acc.costEur !== null && t.costEur !== null
        ? parseFloat(((acc.costEur || 0) + (t.costEur || 0)).toFixed(2))
        : null,
    };
  }, zero);
}

/**
 * Main food handler — parses free-form text into logged food entries.
 * Called from bot/index.js bot.on('text', ...) after onboarding/command checks.
 */
async function foodHandler(ctx) {
  const user = ctx.user;
  const input = ctx.message?.text;

  if (!input) return;

  const mealType = detectMealType(input);

  await ctx.sendChatAction('typing');

  let parsed;
  try {
    parsed = await aiParser.parseFood(input);
  } catch (err) {
    logger.error({ err, userId: user._id.toString() }, 'AI parser threw unexpectedly');
    parsed = null;
  }

  // ── Degraded mode ──────────────────────────────────────────────────────────
  if (parsed === null) {
    return ctx.reply(
      'Не удалось автоматически распознать еду. Введи вручную:\n' +
      '1. Название продукта\n' +
      '2. Количество грамм\n\n' +
      'Или попробуй позже.',
      Markup.inlineKeyboard([
        [
          Markup.button.callback('📝 Ввести вручную', 'manual_entry'),
          Markup.button.callback('🔁 Попробовать снова', 'retry_parse'),
        ],
      ]),
    );
  }

  // ── Enrich parsed items with product data ─────────────────────────────────
  const today = getTodayDate();
  const enrichedItems = [];
  const unrecognized = [];

  for (const item of parsed) {
    // Try to find matching product via text search
    let product = null;
    try {
      product = await Product.findOne({
        userId: user._id,
        $text: { $search: item.name },
      }).lean();
    } catch {
      // text search may fail if index not ready — continue without match
    }

    if (product && !item.uncertain) {
      const nutrients = calcItemNutrients(product, item.grams);
      enrichedItems.push({
        productId: product._id,
        name:      product.name,
        grams:     item.grams,
        ...nutrients,
      });
    } else {
      // No product match or uncertain — ask user instead of saving zeros
      unrecognized.push(item);
    }
  }

  // ── Unrecognized products: do NOT save, prompt user ──────────────────────
  if (unrecognized.length > 0) {
    const names = unrecognized.map((i) => `• ${i.name}`).join('\n');
    const webappUrl = process.env.WEBAPP_URL || 'https://nutritrack-topaz.vercel.app';
    await ctx.reply(
      `❓ Не нашёл в твоей базе:\n${names}\n\nЧто делаем?`,
      {
        reply_markup: {
          inline_keyboard: [[
            { text: '📝 Добавить продукт на сайте', url: `${webappUrl}/products` },
            { text: '❌ Пропустить', callback_data: 'skip_unrecognized' },
          ]],
        },
      },
    );
    return;
  }

  const totals = calcTotals(enrichedItems);

  // Save FoodLog
  await FoodLog.create({
    userId:   user._id,
    date:     today,
    mealType,
    items:    enrichedItems,
    totals,
    source:   'telegram',
    rawInput: input,
  });

  // Load goals and day totals for progress
  const [goal, dayTotals] = await Promise.all([
    Goal.findOne({ userId: user._id }).lean(),
    getDayTotals(user._id, today),
  ]);

  const g = goal || { protein: 100, fat: 100, carbs: 200, fiber: 30, calories: 2100 };

  // ── Build reply message ───────────────────────────────────────────────────
  const itemLines = enrichedItems
    .map((it) => {
      const hasNutrients = it.calories > 0;
      return hasNutrients
        ? `• ${it.name} ${it.grams}г — Б:${it.protein}г Ж:${it.fat}г У:${it.carbs}г ${it.calories} ккал`
        : `• ${it.name} ${it.grams}г — данные не найдены`;
    })
    .join('\n');

  const separator = '─'.repeat(18);

  let message =
    `✅ Записано:\n${itemLines}\n${separator}\n` +
    `Итого: Б:${totals.protein}г Ж:${totals.fat}г У:${totals.carbs}г | ${totals.calories} ккал\n\n` +
    `📊 Прогресс сегодня:\n` +
    `Белки:    ${progressBar(dayTotals.protein, g.protein)} ${dayTotals.protein}г / ${g.protein}г\n` +
    `Жиры:     ${progressBar(dayTotals.fat, g.fat)} ${dayTotals.fat}г / ${g.fat}г\n` +
    `Углеводы: ${progressBar(dayTotals.carbs, g.carbs)} ${dayTotals.carbs}г / ${g.carbs}г`;



  logger.info(
    { userId: user._id.toString(), itemCount: enrichedItems.length, date: today },
    'Food logged via bot',
  );

  return ctx.reply(message);
}

module.exports = foodHandler;

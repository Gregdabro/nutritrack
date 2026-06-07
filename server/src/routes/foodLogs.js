const { Router } = require('express');
const FoodLog = require('../models/FoodLog');
const Product = require('../models/Product');
const Recipe = require('../models/Recipe');
const auth = require('../middleware/auth');
const { validate, validateQuery } = require('../middleware/validate');
const {
  CreateFoodLogSchema,
  ParseFoodSchema,
  RepeatFoodSchema,
  FoodLogDateQuerySchema,
  FoodLogWeekQuerySchema,
  UpdateFoodLogSchema,
} = require('../validation/foodLogSchemas');
const { NotFoundError } = require('../errors/AppError');
const aiParser = require('../services/aiParser');
const { calcItemNutrients, calcTotals } = require('../services/nutritionCalc');
const logger = require('../logger');
const { getTodayDate } = require('../bot/utils');

const router = Router();

router.use(auth);

/**
 * Sum totals across an array of FoodLog documents.
 */
function sumLogTotals(logs) {
  const zero = { protein: 0, fat: 0, carbs: 0, fiber: 0, calories: 0, costEur: 0 };
  if (!logs || logs.length === 0) return zero;
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

// ─── IMPORTANT: Static paths must be registered BEFORE /:id ─────────────────

// POST /api/food-logs/parse
router.post('/parse', validate(ParseFoodSchema), async (req, res, next) => {
  try {
    const { text } = req.body;
    const parsed = await aiParser.parseFood(text);

    if (parsed === null) {
      return res.json({ parsed: null, degraded: true });
    }

    // Try to match each item to a user product via text search
    const enriched = await Promise.all(
      parsed.map(async (item) => {
        try {
          const product = await Product.findOne({
            userId: req.user.userId,
            $text: { $search: item.name },
          }).lean();
          return product
            ? { ...item, matchedProductId: product._id.toString() }
            : item;
        } catch {
          return item;
        }
      }),
    );

    logger.info({ userId: req.user.userId, count: enriched.length }, 'Food parsed by AI');
    res.json({ parsed: enriched, degraded: false });
  } catch (err) {
    next(err);
  }
});

// GET /api/food-logs/week?startDate=YYYY-MM-DD
router.get('/week', validateQuery(FoodLogWeekQuerySchema), async (req, res, next) => {
  try {
    const { startDate } = req.query;
    const start = new Date(startDate);

    // Build array of 7 date strings
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d.toLocaleDateString('sv-SE');
    });

    const logs = await FoodLog.find({
      userId: req.user.userId,
      date: { $in: dates },
    }).lean();

    const days = dates.map((date) => {
      const dayLogs = logs.filter((l) => l.date === date);
      return { date, totals: sumLogTotals(dayLogs) };
    });

    res.json({ days });
  } catch (err) {
    next(err);
  }
});

// POST /api/food-logs/repeat
router.post('/repeat', validate(RepeatFoodSchema), async (req, res, next) => {
  try {
    const { sourceDate, mealType, targetDate } = req.body;

    const source = await FoodLog.findOne({
      userId: req.user.userId,
      date: sourceDate,
      mealType,
    })
      .sort({ loggedAt: -1 })
      .lean();

    if (!source) {
      throw new NotFoundError('FoodLog');
    }

    const newLog = await FoodLog.create({
      userId:   req.user.userId,
      date:     targetDate,
      mealType: source.mealType,
      items:    source.items,
      totals:   source.totals,
      source:   'web',
    });

    logger.info(
      { userId: req.user.userId, sourceDate, targetDate, mealType },
      'FoodLog repeated',
    );
    res.status(201).json(newLog);
  } catch (err) {
    next(err);
  }
});

// GET /api/food-logs?date=YYYY-MM-DD
router.get('/', validateQuery(FoodLogDateQuerySchema), async (req, res, next) => {
  try {
    const date = req.query.date || getTodayDate();

    const logs = await FoodLog.find({
      userId: req.user.userId,
      date,
    }).lean();

    const dailyTotals = sumLogTotals(logs);
    res.json({ logs, dailyTotals });
  } catch (err) {
    next(err);
  }
});

// POST /api/food-logs
router.post('/', validate(CreateFoodLogSchema), async (req, res, next) => {
  try {
    const { date, mealType, items: rawItems } = req.body;

    const enrichedItems = await Promise.all(
      rawItems.map(async (item) => {
        if (item.productId) {
          const product = await Product.findOne({
            _id: item.productId,
            userId: req.user.userId,
          }).lean();
          if (product) {
            const nutrients = calcItemNutrients(product, item.grams);
            return { ...item, ...nutrients };
          }
        }
        if (item.recipeId) {
          const recipe = await Recipe.findOne({
            _id: item.recipeId,
            userId: req.user.userId,
          }).lean();
          if (recipe && recipe.perServingNutrients) {
            const servings = item.servings || 1;
            const ps = recipe.perServingNutrients;
            return {
              ...item,
              protein:  parseFloat((ps.protein  * servings).toFixed(1)),
              fat:      parseFloat((ps.fat      * servings).toFixed(1)),
              carbs:    parseFloat((ps.carbs    * servings).toFixed(1)),
              fiber:    parseFloat((ps.fiber    * servings).toFixed(1)),
              calories: parseFloat((ps.calories * servings).toFixed(0)),
              costEur:  recipe.perServingCostEur != null
                ? parseFloat((recipe.perServingCostEur * servings).toFixed(2))
                : null,
            };
          }
        }
        // No product/recipe match — save as-is with zeroed nutrients
        return {
          ...item,
          protein:  item.protein  ?? 0,
          fat:      item.fat      ?? 0,
          carbs:    item.carbs    ?? 0,
          fiber:    item.fiber    ?? 0,
          calories: item.calories ?? 0,
          costEur:  item.costEur  ?? null,
        };
      }),
    );

    const totals = calcTotals(enrichedItems);

    const foodLog = await FoodLog.create({
      userId: req.user.userId,
      date,
      mealType: mealType || 'snack',
      items:    enrichedItems,
      totals,
      source:   'web',
    });

    logger.info(
      { userId: req.user.userId, logId: foodLog._id.toString(), date },
      'FoodLog created',
    );
    res.status(201).json(foodLog);
  } catch (err) {
    next(err);
  }
});

// PUT /api/food-logs/:id
router.put('/:id', validate(UpdateFoodLogSchema), async (req, res, next) => {
  try {
    const { items: rawItems, mealType } = req.body;

    const updateFields = {};
    if (mealType) updateFields.mealType = mealType;

    if (rawItems) {
      const totals = calcTotals(rawItems);
      updateFields.items = rawItems;
      updateFields.totals = totals;
    }

    const foodLog = await FoodLog.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { $set: updateFields },
      { new: true },
    );

    if (!foodLog) {
      throw new NotFoundError('FoodLog');
    }

    res.json(foodLog);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/food-logs/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await FoodLog.deleteOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (result.deletedCount === 0) {
      throw new NotFoundError('FoodLog');
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;

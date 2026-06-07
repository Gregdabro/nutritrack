const { Router } = require('express');
const Recipe = require('../models/Recipe');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const { NotFoundError, AuthorizationError } = require('../errors/AppError');
const { calcItemNutrients, calcTotals } = require('../services/nutritionCalc');
const logger = require('../logger');

const router = Router();

router.use(auth);

/**
 * Compute totalNutrients, perServingNutrients, totalCostEur, perServingCostEur
 * and denormalized productName for each ingredient.
 */
async function buildRecipeNutrients(ingredients, totalServings, userId) {
  const enriched = await Promise.all(
    ingredients.map(async (ing) => {
      const product = await Product.findOne({
        _id: ing.productId,
        userId,
      }).lean();

      if (!product) {
        throw new NotFoundError(`Product ${ing.productId}`);
      }

      const nutrients = calcItemNutrients(product, ing.grams);
      return {
        productId:   product._id,
        productName: product.name,
        grams:       ing.grams,
        ...nutrients,
      };
    }),
  );

  const totalNutrients = calcTotals(enriched);

  const perServingNutrients = {
    protein:  parseFloat((totalNutrients.protein  / totalServings).toFixed(1)),
    fat:      parseFloat((totalNutrients.fat      / totalServings).toFixed(1)),
    carbs:    parseFloat((totalNutrients.carbs    / totalServings).toFixed(1)),
    fiber:    parseFloat((totalNutrients.fiber    / totalServings).toFixed(1)),
    calories: parseFloat((totalNutrients.calories / totalServings).toFixed(0)),
  };

  const totalCostEur = totalNutrients.costEur != null
    ? parseFloat(totalNutrients.costEur.toFixed(2))
    : null;

  const perServingCostEur = totalCostEur != null
    ? parseFloat((totalCostEur / totalServings).toFixed(2))
    : null;

  return { enriched, totalNutrients, perServingNutrients, totalCostEur, perServingCostEur };
}

// GET /api/recipes?limit=20&offset=0
router.get('/', async (req, res, next) => {
  try {
    const limit  = parseInt(req.query.limit  || '20', 10);
    const offset = parseInt(req.query.offset || '0',  10);

    const [recipes, total] = await Promise.all([
      Recipe.find({ userId: req.user.userId })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      Recipe.countDocuments({ userId: req.user.userId }),
    ]);

    res.json({ recipes, total });
  } catch (err) {
    next(err);
  }
});

// GET /api/recipes/:id
router.get('/:id', async (req, res, next) => {
  try {
    const recipe = await Recipe.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    }).lean();

    if (!recipe) throw new NotFoundError('Recipe');
    res.json(recipe);
  } catch (err) {
    next(err);
  }
});

// POST /api/recipes
router.post('/', async (req, res, next) => {
  try {
    const { name, totalServings, ingredients } = req.body;

    const { enriched, totalNutrients, perServingNutrients, totalCostEur, perServingCostEur } =
      await buildRecipeNutrients(ingredients, totalServings, req.user.userId);

    const recipe = await Recipe.create({
      userId:        req.user.userId,
      name,
      totalServings,
      ingredients:   enriched.map(({ productId, productName, grams }) => ({
        productId, productName, grams,
      })),
      totalNutrients,
      perServingNutrients,
      totalCostEur,
      perServingCostEur,
    });

    logger.info({ userId: req.user.userId, recipeId: recipe._id.toString() }, 'Recipe created');
    res.status(201).json(recipe);
  } catch (err) {
    next(err);
  }
});

// PUT /api/recipes/:id
router.put('/:id', async (req, res, next) => {
  try {
    const existing = await Recipe.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!existing) throw new NotFoundError('Recipe');

    const { name, totalServings, ingredients } = req.body;
    const updateFields = {};

    if (name) updateFields.name = name;

    const servings = totalServings || existing.totalServings;
    if (totalServings) updateFields.totalServings = totalServings;

    if (ingredients) {
      const { enriched, totalNutrients, perServingNutrients, totalCostEur, perServingCostEur } =
        await buildRecipeNutrients(ingredients, servings, req.user.userId);

      updateFields.ingredients = enriched.map(({ productId, productName, grams }) => ({
        productId, productName, grams,
      }));
      updateFields.totalNutrients    = totalNutrients;
      updateFields.perServingNutrients = perServingNutrients;
      updateFields.totalCostEur      = totalCostEur;
      updateFields.perServingCostEur = perServingCostEur;
    }

    const recipe = await Recipe.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { $set: updateFields },
      { new: true },
    );

    res.json(recipe);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/recipes/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await Recipe.deleteOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (result.deletedCount === 0) throw new NotFoundError('Recipe');
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;

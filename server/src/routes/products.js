const { Router } = require('express');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const { validate, validateQuery } = require('../middleware/validate');
const {
  CreateProductSchema,
  UpdateProductSchema,
  AddPriceSchema,
  ListProductsSchema,
} = require('../validation/productSchemas');
const { NotFoundError } = require('../errors/AppError');
const { seedProducts } = require('../config/seedProducts');
const logger = require('../logger');

const router = Router();

router.use(auth);

// GET /api/products — список продуктов с поиском
router.get('/', validateQuery(ListProductsSchema), async (req, res, next) => {
  try {
    const { search, limit, offset } = req.query;

    // Lazy seed: если у пользователя ещё нет продуктов — наполняем стартовыми
    await seedProducts(req.user.userId);

    let products;
    let total;

    if (search) {
      // Короткие запросы (<4 символов) — сразу regex, текстовый индекс не ищет по частичным словам
      if (search.length < 4) {
        const regexFilter = {
          userId: req.user.userId,
          $or: [
            { name:    { $regex: search, $options: 'i' } },
            { aliases: { $regex: search, $options: 'i' } },
          ],
        };
        [products, total] = await Promise.all([
          Product.find(regexFilter).sort({ name: 1 }).skip(offset).limit(limit).lean(),
          Product.countDocuments(regexFilter),
        ]);
      } else {
        // Длинные запросы — текстовый индекс, затем fallback на regex если 0 результатов
        const textFilter = { userId: req.user.userId, $text: { $search: search } };
        const textResults = await Product.find(textFilter)
          .sort({ score: { $meta: 'textScore' } })
          .skip(offset)
          .limit(limit)
          .lean();

        if (textResults.length > 0) {
          products = textResults;
          total = await Product.countDocuments(textFilter);
        } else {
          const regexFilter = {
            userId: req.user.userId,
            $or: [
              { name:    { $regex: search, $options: 'i' } },
              { aliases: { $regex: search, $options: 'i' } },
            ],
          };
          [products, total] = await Promise.all([
            Product.find(regexFilter).sort({ name: 1 }).skip(offset).limit(limit).lean(),
            Product.countDocuments(regexFilter),
          ]);
        }
      }
    } else {
      const filter = { userId: req.user.userId };
      [products, total] = await Promise.all([
        Product.find(filter).sort({ name: 1 }).skip(offset).limit(limit).lean(),
        Product.countDocuments(filter),
      ]);
    }

    res.json({ products, total });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id — получить продукт по id
router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    }).lean();

    if (!product) {
      throw new NotFoundError('Product');
    }

    res.json(product);
  } catch (err) {
    next(err);
  }
});

// POST /api/products — создать продукт
router.post('/', validate(CreateProductSchema), async (req, res, next) => {
  try {
    const product = await Product.create({
      ...req.body,
      userId: req.user.userId,
    });

    logger.info({ productId: product._id.toString(), userId: req.user.userId }, 'Product created');

    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

// PUT /api/products/:id — обновить продукт
router.put('/:id', validate(UpdateProductSchema), async (req, res, next) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { $set: req.body },
      { new: true },
    );

    if (!product) {
      throw new NotFoundError('Product');
    }

    res.json(product);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/products/:id — удалить продукт
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await Product.deleteOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (result.deletedCount === 0) {
      throw new NotFoundError('Product');
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// POST /api/products/:id/price — добавить цену
router.post('/:id/price', validate(AddPriceSchema), async (req, res, next) => {
  try {
    const { priceEur, store } = req.body;

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      {
        $push: {
          priceHistory: { priceEur, store, date: new Date() },
        },
        $set: { currentPriceEur: priceEur },
      },
      { new: true },
    );

    if (!product) {
      throw new NotFoundError('Product');
    }

    logger.info(
      { productId: product._id.toString(), priceEur, store },
      'Price added to product',
    );

    res.json(product);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

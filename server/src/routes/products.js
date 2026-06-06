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
const logger = require('../logger');

const router = Router();

router.use(auth);

// GET /api/products — список продуктов с поиском
router.get('/', validateQuery(ListProductsSchema), async (req, res, next) => {
  try {
    const { search, limit, offset } = req.query;

    let filter = { userId: req.user.userId };

    if (search) {
      filter.$text = { $search: search };
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(search ? { score: { $meta: 'textScore' } } : { name: 1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

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
      req.body,
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

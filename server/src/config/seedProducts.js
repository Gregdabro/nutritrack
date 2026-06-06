const Product = require('../models/Product');
const logger = require('../logger');

const SEED_PRODUCTS = [
  {
    name: 'Куриная грудка',
    aliases: ['курица', 'куриное филе', 'chicken'],
    per100g: { protein: 23.6, fat: 1.9, carbs: 0.4, fiber: 0, calories: 113 },
    category: 'meat',
  },
  {
    name: 'Говядина (вырезка)',
    aliases: ['говядина', 'beef'],
    per100g: { protein: 20.0, fat: 7.0, carbs: 0, fiber: 0, calories: 144 },
    category: 'meat',
  },
  {
    name: 'Яйцо куриное',
    aliases: ['яйцо', 'яйца', 'egg'],
    per100g: { protein: 12.7, fat: 10.9, carbs: 0.7, fiber: 0, calories: 157 },
    category: 'meat',
  },
  {
    name: 'Лосось',
    aliases: ['лосось', 'семга', 'salmon'],
    per100g: { protein: 20.0, fat: 13.4, carbs: 0, fiber: 0, calories: 206 },
    category: 'fish',
  },
  {
    name: 'Тунец консервированный',
    aliases: ['тунец', 'tuna'],
    per100g: { protein: 22.0, fat: 1.0, carbs: 0, fiber: 0, calories: 96 },
    category: 'fish',
  },
  {
    name: 'Творог 9%',
    aliases: ['творог', 'cottage cheese'],
    per100g: { protein: 16.7, fat: 9.0, carbs: 2.0, fiber: 0, calories: 159 },
    category: 'dairy',
  },
  {
    name: 'Сметана 20%',
    aliases: ['сметана'],
    per100g: { protein: 2.8, fat: 20.0, carbs: 3.2, fiber: 0, calories: 206 },
    category: 'dairy',
  },
  {
    name: 'Молоко 3.2%',
    aliases: ['молоко', 'milk'],
    per100g: { protein: 2.9, fat: 3.2, carbs: 4.7, fiber: 0, calories: 60 },
    category: 'dairy',
  },
  {
    name: 'Рис варёный',
    aliases: ['рис', 'rice'],
    per100g: { protein: 2.7, fat: 0.3, carbs: 28.0, fiber: 0.4, calories: 130 },
    category: 'grain',
  },
  {
    name: 'Гречка варёная',
    aliases: ['гречка', 'buckwheat'],
    per100g: { protein: 4.2, fat: 1.1, carbs: 21.3, fiber: 2.7, calories: 110 },
    category: 'grain',
  },
  {
    name: 'Овсянка варёная',
    aliases: ['овсянка', 'овсяная каша', 'oats'],
    per100g: { protein: 2.5, fat: 1.5, carbs: 15.0, fiber: 1.4, calories: 84 },
    category: 'grain',
  },
  {
    name: 'Паста (варёная)',
    aliases: ['паста', 'макароны', 'pasta'],
    per100g: { protein: 5.0, fat: 0.9, carbs: 31.0, fiber: 1.8, calories: 158 },
    category: 'grain',
  },
  {
    name: 'Хлеб цельнозерновой',
    aliases: ['хлеб', 'bread'],
    per100g: { protein: 8.0, fat: 1.0, carbs: 41.0, fiber: 6.0, calories: 198 },
    category: 'grain',
  },
  {
    name: 'Помидор',
    aliases: ['помидор', 'томат', 'tomato'],
    per100g: { protein: 0.9, fat: 0.2, carbs: 3.9, fiber: 1.2, calories: 20 },
    category: 'vegetable',
  },
  {
    name: 'Огурец',
    aliases: ['огурец', 'cucumber'],
    per100g: { protein: 0.8, fat: 0.1, carbs: 2.8, fiber: 0.5, calories: 15 },
    category: 'vegetable',
  },
  {
    name: 'Капуста белокочанная',
    aliases: ['капуста', 'cabbage'],
    per100g: { protein: 1.8, fat: 0.1, carbs: 4.7, fiber: 2.0, calories: 27 },
    category: 'vegetable',
  },
  {
    name: 'Морковь',
    aliases: ['морковь', 'carrot'],
    per100g: { protein: 1.3, fat: 0.1, carbs: 6.9, fiber: 2.4, calories: 35 },
    category: 'vegetable',
  },
  {
    name: 'Перец болгарский',
    aliases: ['перец', 'болгарский перец', 'pepper'],
    per100g: { protein: 1.3, fat: 0.1, carbs: 5.3, fiber: 1.6, calories: 27 },
    category: 'vegetable',
  },
  {
    name: 'Свёкла варёная',
    aliases: ['свёкла', 'свекла', 'beet'],
    per100g: { protein: 1.7, fat: 0.0, carbs: 9.6, fiber: 2.0, calories: 44 },
    category: 'vegetable',
  },
  {
    name: 'Картофель варёный',
    aliases: ['картофель', 'картошка', 'potato'],
    per100g: { protein: 2.0, fat: 0.4, carbs: 16.7, fiber: 1.4, calories: 77 },
    category: 'vegetable',
  },
  {
    name: 'Банан',
    aliases: ['банан', 'banana'],
    per100g: { protein: 1.5, fat: 0.2, carbs: 21.8, fiber: 2.6, calories: 96 },
    category: 'fruit',
  },
  {
    name: 'Яблоко',
    aliases: ['яблоко', 'apple'],
    per100g: { protein: 0.4, fat: 0.4, carbs: 9.8, fiber: 1.8, calories: 47 },
    category: 'fruit',
  },
  {
    name: 'Кофе americano (без молока)',
    aliases: ['кофе', 'coffee', 'американо'],
    per100g: { protein: 0.2, fat: 0, carbs: 0, fiber: 0, calories: 2 },
    category: 'drink',
  },
  {
    name: 'Вода',
    aliases: ['вода', 'water'],
    per100g: { protein: 0, fat: 0, carbs: 0, fiber: 0, calories: 0 },
    category: 'drink',
  },
  {
    name: 'Пиво светлое',
    aliases: ['пиво', 'beer'],
    per100g: { protein: 0.3, fat: 0, carbs: 3.5, fiber: 0, calories: 43 },
    category: 'drink_undesirable',
  },
];

async function seedProducts(userId) {
  const count = await Product.countDocuments({ userId });

  if (count > 0) {
    logger.info({ userId: userId.toString(), count }, 'Products already seeded, skipping');
    return;
  }

  const products = SEED_PRODUCTS.map((p) => ({ ...p, userId }));
  await Product.insertMany(products);

  logger.info({ userId: userId.toString(), count: products.length }, 'Seed products inserted');
}

module.exports = { seedProducts };

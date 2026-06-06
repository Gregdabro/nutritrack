const { z } = require('zod');

const CATEGORIES = [
  'meat', 'fish', 'dairy', 'grain', 'vegetable', 'fruit',
  'drink', 'drink_undesirable', 'supplement', 'other',
];

const CreateProductSchema = z.object({
  name: z.string().min(1).max(200),
  aliases: z.array(z.string()).optional(),
  per100g: z.object({
    protein:  z.number().min(0).optional(),
    fat:      z.number().min(0).optional(),
    carbs:    z.number().min(0).optional(),
    fiber:    z.number().min(0).optional(),
    calories: z.number().min(0).optional(),
  }).optional(),
  currentPriceEur: z.number().positive().nullable().optional(),
  category: z.enum(CATEGORIES).optional(),
});

const UpdateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  aliases: z.array(z.string()).optional(),
  per100g: z.object({
    protein:  z.number().min(0).optional(),
    fat:      z.number().min(0).optional(),
    carbs:    z.number().min(0).optional(),
    fiber:    z.number().min(0).optional(),
    calories: z.number().min(0).optional(),
  }).optional(),
  currentPriceEur: z.number().positive().nullable().optional(),
  category: z.enum(CATEGORIES).optional(),
});

const AddPriceSchema = z.object({
  priceEur: z.number().positive(),
  store: z.string().min(1).max(100),
});

const ListProductsSchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

module.exports = {
  CreateProductSchema,
  UpdateProductSchema,
  AddPriceSchema,
  ListProductsSchema,
};

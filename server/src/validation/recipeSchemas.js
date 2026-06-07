// server/src/validation/recipeSchemas.js
const { z } = require('zod');

const IngredientSchema = z.object({
  productId: z.string().min(1),
  grams:     z.number().positive().max(10000),
});

const CreateRecipeSchema = z.object({
  name:          z.string().min(1).max(200),
  totalServings: z.number().int().positive().max(100),
  ingredients:   z.array(IngredientSchema).min(1),
});

const UpdateRecipeSchema = z.object({
  name:          z.string().min(1).max(200).optional(),
  totalServings: z.number().int().positive().max(100).optional(),
  ingredients:   z.array(IngredientSchema).min(1).optional(),
});

module.exports = { CreateRecipeSchema, UpdateRecipeSchema };

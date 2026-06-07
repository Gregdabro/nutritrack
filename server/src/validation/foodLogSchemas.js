const { z } = require('zod');

const FoodItemSchema = z.object({
  productId: z.string().optional(),
  recipeId:  z.string().optional(),
  name:      z.string().min(1).max(200),
  grams:     z.number().positive().max(10000),
  servings:  z.number().positive().optional(),
});

const CreateFoodLogSchema = z.object({
  date:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
  items:    z.array(FoodItemSchema).min(1),
});

const ParseFoodSchema = z.object({
  text: z.string().min(1).max(1000),
});

const RepeatFoodSchema = z.object({
  sourceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealType:   z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const FoodLogDateQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const FoodLogWeekQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

module.exports = {
  FoodItemSchema,
  CreateFoodLogSchema,
  ParseFoodSchema,
  RepeatFoodSchema,
  FoodLogDateQuerySchema,
  FoodLogWeekQuerySchema,
};

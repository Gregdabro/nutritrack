const { z } = require('zod');

const UpdateGoalSchema = z.object({
  protein:      z.number().positive().optional(),
  fat:          z.number().positive().optional(),
  carbs:        z.number().positive().optional(),
  fiber:        z.number().positive().optional(),
  calories:     z.number().positive().optional(),
  water:        z.number().positive().optional(),
  weeklyBudget: z.number().positive().nullable().optional(),
});

module.exports = { UpdateGoalSchema };

const { z } = require('zod');

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const CreateWeightSchema = z.object({
  date: z.string().regex(dateRegex, 'Invalid date format (YYYY-MM-DD)'),
  weightKg: z.number().positive().min(20).max(300),
});

module.exports = {
  CreateWeightSchema,
};

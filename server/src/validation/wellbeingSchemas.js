const { z } = require('zod');

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const CreateWellbeingSchema = z.object({
  date: z.string().regex(dateRegex, 'Invalid date format (YYYY-MM-DD)'),
  overall: z.enum(['great', 'good', 'ok', 'bad', 'sick']),
  energy: z.number().int().min(1).max(5).optional().nullable(),
  sleep: z.number().int().min(1).max(5).optional().nullable(),
  stress: z.number().int().min(1).max(5).optional().nullable(),
  mood: z.number().int().min(1).max(5).optional().nullable(),
  symptoms: z.array(z.enum(['back_pain', 'joint_pain', 'fatigue', 'headache', 'stomach', 'other'])).optional(),
  notes: z.string().max(1000).optional(),
});

module.exports = {
  CreateWellbeingSchema,
};

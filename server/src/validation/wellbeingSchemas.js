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

const UpdateWellbeingSchema = z.object({
  date: z.string().regex(dateRegex, 'Invalid date format (YYYY-MM-DD)').optional(),
  overall: z.enum(['great', 'good', 'ok', 'bad', 'sick']).optional(),
  energy: z.number().int().min(1).max(5).optional().nullable(),
  sleep: z.number().int().min(1).max(5).optional().nullable(),
  stress: z.number().int().min(1).max(5).optional().nullable(),
  mood: z.number().int().min(1).max(5).optional().nullable(),
  symptoms: z.array(z.enum(['back_pain', 'joint_pain', 'fatigue', 'headache', 'stomach', 'other'])).optional(),
  notes: z.string().max(1000).optional(),
});

const WellbeingQuerySchema = z.object({
  date: z.string().regex(dateRegex).optional(),
  startDate: z.string().regex(dateRegex).optional(),
  endDate: z.string().regex(dateRegex).optional(),
});

module.exports = {
  CreateWellbeingSchema,
  UpdateWellbeingSchema,
  WellbeingQuerySchema,
};

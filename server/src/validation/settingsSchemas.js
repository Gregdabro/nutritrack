const { z } = require('zod');

const UpdateProfileSchema = z.object({
  weightKg: z.number().positive().min(20).max(300).optional(),
  heightCm: z.number().positive().min(50).max(250).optional(),
  timezone: z.string().min(1).max(100).optional(),
});

module.exports = { UpdateProfileSchema };

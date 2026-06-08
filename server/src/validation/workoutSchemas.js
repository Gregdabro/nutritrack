const { z } = require('zod');

const SetSchema = z.object({
  reps:        z.number().int().positive().optional(),
  weightKg:    z.number().min(0).optional(),
  durationSec: z.number().positive().optional(),
});

const ExerciseSchema = z.object({
  name:  z.string().min(1).max(100),
  sets:  z.array(SetSchema).optional(),
  notes: z.string().max(500).optional(),
});

const WorkoutTypeEnum = z.enum(['home', 'gym', 'run', 'bike', 'swim', 'other']);

const CreateWorkoutSchema = z.object({
  date:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  name:            z.string().min(1).max(100),
  type:            WorkoutTypeEnum.optional(),
  exercises:       z.array(ExerciseSchema).optional(),
  durationMinutes: z.number().positive().max(600).optional(),
  perceivedEffort: z.number().int().min(1).max(10).optional(),
  notes:           z.string().max(1000).optional(),
});

const UpdateWorkoutSchema = z.object({
  date:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  name:            z.string().min(1).max(100).optional(),
  type:            WorkoutTypeEnum.optional(),
  exercises:       z.array(ExerciseSchema).optional(),
  durationMinutes: z.number().positive().max(600).optional(),
  perceivedEffort: z.number().int().min(1).max(10).optional(),
  notes:           z.string().max(1000).optional(),
});

module.exports = { CreateWorkoutSchema, UpdateWorkoutSchema };

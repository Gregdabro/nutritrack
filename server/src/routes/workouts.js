const { Router } = require('express');
const Workout = require('../models/Workout');
const auth = require('../middleware/auth');
const { validate, validateQuery } = require('../middleware/validate');
const { CreateWorkoutSchema, UpdateWorkoutSchema, WorkoutQuerySchema } = require('../validation/workoutSchemas');
const { NotFoundError, AuthorizationError } = require('../errors/AppError');
const { calcCaloriesBurned } = require('../services/caloriesBurned');
const User = require('../models/User');
const logger = require('../logger');

const router = Router();

router.use(auth);

// GET /api/workouts?date=YYYY-MM-DD
// GET /api/workouts?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/', validateQuery(WorkoutQuerySchema), async (req, res, next) => {
  try {
    const { date, startDate, endDate } = req.query;
    const filter = { userId: req.user.userId };

    if (date) {
      filter.date = date;
    } else if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const workouts = await Workout.find(filter).sort({ date: -1, createdAt: -1 }).lean();
    res.json(workouts);
  } catch (err) {
    next(err);
  }
});

// GET /api/workouts/:id
router.get('/:id', async (req, res, next) => {
  try {
    const workout = await Workout.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    }).lean();
    if (!workout) throw new NotFoundError('Workout');
    res.json(workout);
  } catch (err) {
    next(err);
  }
});

// POST /api/workouts
router.post('/', validate(CreateWorkoutSchema), async (req, res, next) => {
  try {
    const { type = 'home', durationMinutes, ...rest } = req.body;

    // Fetch user weight for calorie calculation
    const user = await User.findById(req.user.userId).lean();
    const weightKg = user?.weightKg || 75;

    const caloriesBurned =
      durationMinutes ? calcCaloriesBurned(type, durationMinutes, weightKg) : 0;

    const workout = await Workout.create({
      userId: req.user.userId,
      type,
      durationMinutes,
      caloriesBurned,
      ...rest,
    });

    logger.info(
      { userId: req.user.userId, workoutId: workout._id.toString(), date: workout.date },
      'Workout created',
    );
    res.status(201).json(workout);
  } catch (err) {
    next(err);
  }
});

// PUT /api/workouts/:id
router.put('/:id', validate(UpdateWorkoutSchema), async (req, res, next) => {
  try {
    const existing = await Workout.findById(req.params.id).lean();
    if (!existing) throw new NotFoundError('Workout');
    if (existing.userId.toString() !== req.user.userId) throw new AuthorizationError();

    const updates = { ...req.body };

    // Recalculate calories if type or durationMinutes changed
    const newType = updates.type ?? existing.type;
    const newDuration = updates.durationMinutes ?? existing.durationMinutes;

    if (
      (updates.type !== undefined || updates.durationMinutes !== undefined) &&
      newDuration
    ) {
      const user = await User.findById(req.user.userId).lean();
      const weightKg = user?.weightKg || 75;
      updates.caloriesBurned = calcCaloriesBurned(newType, newDuration, weightKg);
    }

    const workout = await Workout.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true },
    );

    logger.info(
      { userId: req.user.userId, workoutId: req.params.id },
      'Workout updated',
    );
    res.json(workout);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/workouts/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await Workout.findById(req.params.id).lean();
    if (!existing) throw new NotFoundError('Workout');
    if (existing.userId.toString() !== req.user.userId) throw new AuthorizationError();

    await Workout.deleteOne({ _id: req.params.id });

    logger.info(
      { userId: req.user.userId, workoutId: req.params.id },
      'Workout deleted',
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;

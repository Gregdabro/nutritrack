const { Router } = require('express');
const Goal = require('../models/Goal');
const auth = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { UpdateGoalSchema } = require('../validation/goalSchemas');
const logger = require('../logger');

const router = Router();

router.use(auth);

router.get('/', async (req, res, next) => {
  try {
    let goal = await Goal.findOne({ userId: req.user.userId });
    if (!goal) {
      goal = await Goal.create({ userId: req.user.userId });
      logger.info({ userId: req.user.userId }, 'Default goals created');
    }
    res.json(goal);
  } catch (err) {
    next(err);
  }
});

router.put('/', validate(UpdateGoalSchema), async (req, res, next) => {
  try {
    const goal = await Goal.findOneAndUpdate(
      { userId: req.user.userId },
      { ...req.body, updatedAt: new Date() },
      { upsert: true, new: true },
    );

    logger.info({ userId: req.user.userId }, 'Goals updated');

    res.json(goal);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

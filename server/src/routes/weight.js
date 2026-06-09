const express = require('express');
const WeightLog = require('../models/WeightLog');
const requireAuth = require('../middleware/requireAuth');
const validate = require('../middleware/validate');
const { CreateWeightSchema } = require('../validation/weightSchemas');
const { AuthorizationError, NotFoundError } = require('../utils/errors');

const router = express.Router();

router.use(requireAuth);

function calcMovingAverage(logs, windowSize = 7) {
  return logs.map((log, i) => {
    const window = logs.slice(Math.max(0, i - windowSize + 1), i + 1);
    const avg = window.reduce((s, l) => s + l.weightKg, 0) / window.length;
    return { date: log.date, avg: +avg.toFixed(1) };
  });
}

router.get('/', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 30;
    
    // Запрашиваем limit + 6, чтобы окно MA было полным для возвращаемых записей
    const rawDesc = await WeightLog.find({ userId: req.user._id })
      .sort({ date: -1 })
      .limit(limit + 6);

    const raw = rawDesc.reverse();

    const withAvg = calcMovingAverage(raw);
    
    // Возвращаем только нужные limit записей
    const logs = raw.slice(-limit);
    const movingAverage = withAvg.slice(-limit);

    res.json({ logs, movingAverage });
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(CreateWeightSchema), async (req, res, next) => {
  try {
    const { date, weightKg } = req.body;

    const log = await WeightLog.findOneAndUpdate(
      { userId: req.user._id, date },
      { weightKg, loggedAt: new Date() },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', validate(CreateWeightSchema), async (req, res, next) => {
  try {
    const log = await WeightLog.findById(req.params.id);
    if (!log) {
      throw new NotFoundError('WeightLog');
    }

    if (log.userId.toString() !== req.user._id.toString()) {
      throw new AuthorizationError('Нет прав для изменения этой записи');
    }

    log.weightKg = req.body.weightKg;
    if (req.body.date) {
      log.date = req.body.date;
    }
    await log.save();

    res.json(log);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

const express = require('express');
const WellbeingLog = require('../models/WellbeingLog');
const requireAuth = require('../middleware/requireAuth');
const validate = require('../middleware/validate');
const { CreateWellbeingSchema } = require('../validation/wellbeingSchemas');
const { AppError, AuthorizationError, NotFoundError } = require('../utils/errors');

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const { date, startDate, endDate } = req.query;

    if (date) {
      const log = await WellbeingLog.findOne({ userId: req.user._id, date });
      return res.json(log);
    }

    if (startDate && endDate) {
      const logs = await WellbeingLog.find({
        userId: req.user._id,
        date: { $gte: startDate, $lte: endDate },
      }).sort({ date: 1 });
      return res.json(logs);
    }

    const logs = await WellbeingLog.find({ userId: req.user._id }).sort({ date: 1 });
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(CreateWellbeingSchema), async (req, res, next) => {
  try {
    const { date } = req.body;

    const existing = await WellbeingLog.findOne({ userId: req.user._id, date });
    if (existing) {
      throw new AppError('Запись за эту дату уже существует', 409, 'ALREADY_EXISTS');
    }

    const log = await WellbeingLog.create({
      userId: req.user._id,
      ...req.body,
    });

    res.status(201).json(log);
  } catch (err) {
    if (err.code === 11000) {
      return next(new AppError('Запись за эту дату уже существует', 409, 'ALREADY_EXISTS'));
    }
    next(err);
  }
});

router.put('/:id', validate(CreateWellbeingSchema), async (req, res, next) => {
  try {
    const log = await WellbeingLog.findById(req.params.id);
    if (!log) {
      throw new NotFoundError('WellbeingLog');
    }

    if (log.userId.toString() !== req.user._id.toString()) {
      throw new AuthorizationError('Нет прав для изменения этой записи');
    }

    Object.assign(log, req.body);
    await log.save();

    res.json(log);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

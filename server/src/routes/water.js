const express = require('express');
const WaterLog = require('../models/WaterLog');
const requireAuth = require('../middleware/auth');
const { z } = require('zod');
const { validate } = require('../middleware/validate');

const router = express.Router();
router.use(requireAuth);

const WaterSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amountMl: z.number().min(0).max(10000)
});

router.get('/', async (req, res, next) => {
  try {
    const { date, startDate, endDate } = req.query;
    if (date) {
      const log = await WaterLog.findOne({ userId: req.user.userId, date });
      return res.json(log || { date, amountMl: 0 });
    }
    if (startDate && endDate) {
      const logs = await WaterLog.find({
        userId: req.user.userId,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: 1 });
      return res.json(logs);
    }
    return res.json([]);
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(WaterSchema), async (req, res, next) => {
  try {
    const { date, amountMl } = req.body;
    const log = await WaterLog.findOneAndUpdate(
      { userId: req.user.userId, date },
      { amountMl, loggedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json(log);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

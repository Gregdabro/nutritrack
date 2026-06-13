const express = require('express');
const { z } = require('zod');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

const RemindersSchema = z.object({
  morningEnabled: z.boolean(),
  morningTime:    z.string().regex(/^\d{2}:\d{2}$/),
  eveningEnabled: z.boolean(),
  eveningTime:    z.string().regex(/^\d{2}:\d{2}$/),
});

const { UpdateProfileSchema } = require('../validation/settingsSchemas');

// GET /api/settings/reminders
router.get('/reminders', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).lean();
    const reminders = user.reminders || {
      morningEnabled: true,
      morningTime: '08:00',
      eveningEnabled: true,
      eveningTime: '21:00'
    };
    res.json({ reminders });
  } catch (err) {
    next(err);
  }
});

// PUT /api/settings/reminders
router.put('/reminders', auth, validate(RemindersSchema), async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: { reminders: req.body } },
      { new: true }
    ).lean();
    
    res.json({ reminders: user.reminders });
  } catch (err) {
    next(err);
  }
});

// PUT /api/settings/profile
router.put('/profile', auth, validate(UpdateProfileSchema), async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: req.body },
      { new: true, runValidators: true }
    ).lean();

    res.json({
      weightKg: user.weightKg,
      heightCm: user.heightCm,
      timezone: user.timezone
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

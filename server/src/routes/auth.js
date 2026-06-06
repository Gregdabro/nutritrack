const { Router } = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { AuthenticationError, NotFoundError } = require('../errors/AppError');
const validate = require('../middleware/validate');
const { TelegramAuthSchema, BotLoginSchema } = require('../validation/authSchemas');
const logger = require('../logger');

const router = Router();

function validateTelegramHash(data) {
  const { hash, ...rest } = data;
  const dataCheckString = Object.keys(rest)
    .sort()
    .map(k => `${k}=${rest[k]}`)
    .join('\n');
  const secretKey = crypto.createHmac('sha256', 'WebAppData')
    .update(process.env.BOT_TOKEN).digest();
  const expectedHash = crypto.createHmac('sha256', secretKey)
    .update(dataCheckString).digest('hex');
  return hash === expectedHash;
}

function generateToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), telegramId: user.telegramId },
    process.env.JWT_SECRET,
    { expiresIn: '30d' },
  );
}

router.post('/telegram', validate(TelegramAuthSchema), async (req, res, next) => {
  try {
    const data = req.body;

    if (!validateTelegramHash(data)) {
      throw new AuthenticationError('Invalid Telegram hash');
    }

    const user = await User.findOneAndUpdate(
      { telegramId: String(data.id) },
      {
        telegramId: String(data.id),
        firstName: data.first_name,
        ...(data.last_name && { lastName: data.last_name }),
        ...(data.username && { username: data.username }),
        ...(data.photo_url && { photoUrl: data.photo_url }),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    const token = generateToken(user);

    logger.info({ userId: user._id.toString() }, 'User authenticated via Telegram');

    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        telegramId: user.telegramId,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/bot-login', validate(BotLoginSchema), async (req, res, next) => {
  try {
    const { telegramId, botSecret } = req.body;

    if (botSecret !== process.env.BOT_SECRET) {
      throw new AuthenticationError('Invalid bot secret');
    }

    const user = await User.findOne({ telegramId });
    if (!user) {
      throw new NotFoundError('User');
    }

    const token = generateToken(user);

    logger.info({ userId: user._id.toString() }, 'Bot login successful');

    res.json({ token });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

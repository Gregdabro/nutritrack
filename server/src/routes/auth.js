const { Router } = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const LoginToken = require('../models/LoginToken');
const { AuthenticationError, NotFoundError } = require('../errors/AppError');
const { validate } = require('../middleware/validate');
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

    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (currentTimestamp - data.auth_date > 86400) {
      throw new AuthenticationError('Telegram login data is outdated (replay attack protection)');
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

// ---- Bot-Based Login Tokens ----
// Одноразовые токены: бот генерирует, фронтенд обменивает на JWT

async function createLoginToken(user) {
  const raw = crypto.randomBytes(32).toString('hex');
  await LoginToken.create({
    token: raw,
    userId: user._id,
  });
  return raw;
}

// GET: обменять одноразовый токен на JWT
router.get('/login-token/:rawToken', async (req, res, next) => {
  try {
    const entry = await LoginToken.findOneAndDelete({ token: req.params.rawToken });
    if (!entry) {
      throw new AuthenticationError('Invalid or expired login token');
    }

    const user = await User.findById(entry.userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const token = generateToken(user);

    logger.info({ userId: user._id.toString() }, 'User authenticated via bot login token');

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

// DEV-only: упрощённый вход для локального тестирования
router.post('/dev-login', async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new NotFoundError('Route');
    }

    const telegramId = String(req.body.telegramId || `dev_${Date.now()}`);
    const firstName = req.body.firstName || 'DevUser';

    let user = await User.findOne({ telegramId });
    if (!user) {
      user = await User.create({ telegramId, firstName });
    }

    const token = generateToken(user);

    logger.info({ userId: user._id.toString() }, 'Dev login');

    res.json({
      token,
      user: { id: user._id, firstName: user.firstName, telegramId: user.telegramId },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = { router, createLoginToken };

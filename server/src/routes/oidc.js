const { Router } = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AuthenticationError } = require('../errors/AppError');
const logger = require('../logger');

const router = Router();

// Telegram hash validation (тот же алгоритм, что в auth.js)
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

// GET: редирект-колбэк от старого виджета (data-auth-url)
// Telegram делает GET на этот URL с параметрами: id, first_name, hash, auth_date, ...
router.get('/callback', async (req, res) => {
  try {
    const { hash, id, first_name, last_name, username, photo_url, auth_date } = req.query;

    if (!hash || !id) {
      const frontendUrl = process.env.WEBAPP_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/login?error=missing_data`);
    }

    // Проверяем hash
    const data = { id: Number(id), first_name, hash, auth_date: Number(auth_date) };
    if (last_name) data.last_name = last_name;
    if (username) data.username = username;
    if (photo_url) data.photo_url = photo_url;

    if (!validateTelegramHash(data)) {
      logger.warn({ telegramId: id }, 'Invalid hash in OIDC callback');
      const frontendUrl = process.env.WEBAPP_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/login?error=invalid_hash`);
    }

    // Upsert пользователя
    const user = await User.findOneAndUpdate(
      { telegramId: String(id) },
      {
        telegramId: String(id),
        firstName: first_name || 'User',
        ...(last_name && { lastName: last_name }),
        ...(username && { username }),
        ...(photo_url && { photoUrl: photo_url }),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    // Выдаём JWT
    const appToken = jwt.sign(
      { userId: user._id.toString(), telegramId: user.telegramId },
      process.env.JWT_SECRET,
      { expiresIn: '30d' },
    );

    logger.info({ userId: user._id.toString() }, 'User authenticated via redirect-login');

    // Редирект на фронтенд с токеном в URL
    const frontendUrl = process.env.WEBAPP_URL || 'http://localhost:5173';
    const params = new URLSearchParams({
      token: appToken,
      userId: user._id.toString(),
      firstName: user.firstName,
      telegramId: user.telegramId,
    });

    res.redirect(`${frontendUrl}/login/success?${params.toString()}`);
  } catch (err) {
    logger.error({ err: err.message }, 'Redirect-login callback failed');
    const frontendUrl = process.env.WEBAPP_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?error=auth_failed`);
  }
});

module.exports = router;

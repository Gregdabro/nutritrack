const { Router } = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { createRemoteJWKSet, jwtVerify } = require('jose');
const User = require('../models/User');
const { AuthenticationError } = require('../errors/AppError');
const logger = require('../logger');

const router = Router();

// Конфигурация
const CLIENT_ID = process.env.TELEGRAM_CLIENT_ID;
const CLIENT_SECRET = process.env.TELEGRAM_CLIENT_SECRET;
const REDIRECT_URI = process.env.OIDC_REDIRECT_URI
  || `${process.env.WEBAPP_URL || ''}/api/auth/oidc/callback`;
const TELEGRAM_JWKS = createRemoteJWKSet(
  new URL('https://oauth.telegram.org/.well-known/jwks.json'),
);

// In-memory хранилище PKCE и state (с TTL)
const pendingAuth = new Map();

// Очистка просроченных записей каждые 5 минут
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of pendingAuth) {
    if (now - entry.createdAt > 600_000) pendingAuth.delete(key); // 10 мин
  }
}, 300_000);

function base64URL(buf) {
  return buf.toString('base64url');
}

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest();
}

function generateState() {
  return crypto.randomBytes(32).toString('hex');
}

// GET: сгенерировать URL для редиректа на Telegram OAuth
router.get('/auth-url', (_req, res) => {
  try {
    const state = generateState();
    const codeVerifier = base64URL(crypto.randomBytes(32));
    const codeChallenge = base64URL(sha256(codeVerifier));

    pendingAuth.set(state, {
      verifier: codeVerifier,
      createdAt: Date.now(),
    });

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: 'openid profile',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    const url = `https://oauth.telegram.org/auth?${params.toString()}`;

    res.json({ url });
  } catch (err) {
    logger.error({ err }, 'Failed to generate OIDC URL');
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to generate auth URL' });
  }
});

// GET: callback от Telegram OAuth
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;

    if (error) {
      logger.warn({ error, error_description }, 'Telegram OAuth error');
      const frontendUrl = process.env.WEBAPP_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(error_description || error)}`);
    }

    if (!code) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Missing code parameter' });
    }

    // Проверяем state
    const pending = pendingAuth.get(state);
    if (!pending) {
      logger.warn({ state }, 'Invalid or expired OIDC state');
      const frontendUrl = process.env.WEBAPP_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/login?error=expired_state`);
    }
    pendingAuth.delete(state);

    // Обмениваем code на id_token
    const tokenResponse = await axios.post(
      'https://oauth.telegram.org/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        code_verifier: pending.verifier,
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        auth: { username: CLIENT_ID, password: CLIENT_SECRET },
        timeout: 10000,
      },
    );

    const { id_token } = tokenResponse.data;
    if (!id_token) {
      logger.error('No id_token in Telegram response');
      throw new AuthenticationError('No id_token received from Telegram');
    }

    // Валидируем id_token через JWKS
    const { payload } = await jwtVerify(id_token, TELEGRAM_JWKS, {
      issuer: 'https://oauth.telegram.org',
      audience: CLIENT_ID,
    });

    logger.info({ sub: payload.sub }, 'OIDC id_token validated');

    // Извлекаем данные пользователя
    const telegramId = String(payload.id || payload.sub);
    const firstName = payload.name || payload.preferred_username || `User_${telegramId}`;

    // Upsert пользователя
    const user = await User.findOneAndUpdate(
      { telegramId },
      {
        telegramId,
        firstName,
        ...(payload.preferred_username && { username: payload.preferred_username }),
        ...(payload.picture && { photoUrl: payload.picture }),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    // Выдаём JWT
    const appToken = jwt.sign(
      { userId: user._id.toString(), telegramId: user.telegramId },
      process.env.JWT_SECRET,
      { expiresIn: '30d' },
    );

    logger.info({ userId: user._id.toString() }, 'User authenticated via OIDC');

    // Редирект на фронтенд с токеном
    const frontendUrl = process.env.WEBAPP_URL || 'http://localhost:5173';
    const redirectParams = new URLSearchParams({
      token: appToken,
      userId: user._id.toString(),
      firstName: user.firstName,
      telegramId: user.telegramId,
    });

    res.redirect(`${frontendUrl}/login/success?${redirectParams.toString()}`);
  } catch (err) {
    logger.error({ err: err.message }, 'OIDC callback failed');
    const frontendUrl = process.env.WEBAPP_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?error=auth_failed`);
  }
});

module.exports = router;

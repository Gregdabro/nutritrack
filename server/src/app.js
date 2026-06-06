require('dotenv').config();

const express = require('express');
const logger = require('./logger');
const { connectDB } = require('./config/db');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const goalRoutes = require('./routes/goals');
const bot = require('./bot');

async function main() {
  await connectDB();

  const app = express();
  app.use(requestLogger);
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/goals', goalRoutes);

  app.use(errorHandler);

  const port = process.env.PORT || 3001;

  if (process.env.NODE_ENV === 'production') {
    const domain = process.env.RAILWAY_STATIC_URL;
    if (!domain) {
      logger.error('RAILWAY_STATIC_URL is not set in production');
      process.exit(1);
    }
    const webhookPath = await bot.createWebhook({ domain });
    app.use(webhookPath);
    logger.info({ domain }, 'Bot webhook configured');
  } else {
    bot.launch();
    logger.info('Bot started in polling mode');
  }

  const server = app.listen(port, () => {
    logger.info({ port }, 'Server started');
  });

  async function shutdown(signal) {
    logger.info({ signal }, 'Shutting down');
    bot.stop(signal);
    server.close();
    process.exit(0);
  }

  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});

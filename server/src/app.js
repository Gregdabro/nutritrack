require('dotenv').config();

const express = require('express');
const cors = require('cors');
const logger = require('./logger');
const { connectDB } = require('./config/db');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const goalRoutes = require('./routes/goals');
const productRoutes = require('./routes/products');
const foodLogRoutes = require('./routes/foodLogs');
const recipeRoutes   = require('./routes/recipes');
const workoutRoutes  = require('./routes/workouts');
const bot = require('./bot');

async function main() {
  await connectDB();

  const app = express();
  app.use(cors());
  app.use(requestLogger);
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes.router);
  app.use('/api/goals', goalRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/food-logs', foodLogRoutes);
  app.use('/api/recipes',   recipeRoutes);
  app.use('/api/workouts',  workoutRoutes);

  app.use(errorHandler);

  const port = process.env.PORT || 3001;

  if (process.env.NODE_ENV === 'production') {
    const publicDomain = process.env.RAILWAY_PUBLIC_DOMAIN;
    const staticUrl = process.env.RAILWAY_STATIC_URL;
    const domain = publicDomain || staticUrl;

    if (domain) {
      const hostname = publicDomain || new URL(staticUrl).hostname;
      try {
        const webhookPath = await bot.createWebhook({ domain: hostname });
        app.use(webhookPath, bot.webhookCallback(webhookPath));
        logger.info({ hostname, webhookPath }, 'Bot webhook configured');
      } catch (webhookErr) {
        logger.error({ err: webhookErr }, 'Webhook setup failed, falling back to polling');
        bot.launch();
        logger.info('Bot started in polling mode (fallback)');
      }
    } else {
      logger.warn('No Railway domain found, starting bot in polling mode');
      bot.launch();
      logger.info('Bot started in polling mode');
    }
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

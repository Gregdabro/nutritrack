const { Telegraf } = require('telegraf');
const logger = require('../logger');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => {
  logger.info({ command: '/start' }, 'bot command');
  ctx.reply('Привет! Бот NutriTrack работает.');
});

module.exports = bot;

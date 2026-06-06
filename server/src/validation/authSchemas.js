const { z } = require('zod');

const TelegramAuthSchema = z.object({
  id:         z.number(),
  first_name: z.string(),
  last_name:  z.string().optional(),
  username:   z.string().optional(),
  photo_url:  z.string().optional(),
  hash:       z.string(),
  auth_date:  z.number(),
});

const BotLoginSchema = z.object({
  telegramId: z.string(),
  botSecret:  z.string(),
});

module.exports = { TelegramAuthSchema, BotLoginSchema };

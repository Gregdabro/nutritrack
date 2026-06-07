const axios = require('axios');
const AIProvider = require('./AIProvider');

const SYSTEM_PROMPT = `Ты — помощник по учёту питания.
Твоя задача: из текста на русском языке извлечь список продуктов и их количество в граммах.

Правила:
- Возвращай ТОЛЬКО JSON массив, без пояснений
- Если граммы не указаны явно, используй типичную порцию (яйцо = 60г, банан = 120г)
- Для напитков переводи в мл (стакан воды = 250мл, чашка кофе = 200мл)
- Если продукт неоднозначен, включи его с пометкой "uncertain": true

Формат:
[{"name": "название на русском", "grams": число, "uncertain": false}]`;

class DeepSeekProvider extends AIProvider {
  async parseFood(input) {
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        max_tokens: 500,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: input },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      },
    );

    const raw = response.data.choices[0].message.content.trim();
    return JSON.parse(raw);
  }
}

module.exports = DeepSeekProvider;

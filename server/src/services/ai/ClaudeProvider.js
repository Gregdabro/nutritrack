const Anthropic = require('@anthropic-ai/sdk');
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

class ClaudeProvider extends AIProvider {
  constructor() {
    super();
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async parseFood(input) {
    const response = await this.client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: input },
      ],
    });

    const raw = response.content[0].text.trim();
    return JSON.parse(raw);
  }
}

module.exports = ClaudeProvider;

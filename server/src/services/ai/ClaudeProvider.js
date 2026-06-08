const Anthropic = require('@anthropic-ai/sdk');
const AIProvider = require('./AIProvider');

const FOOD_SYSTEM_PROMPT = `Ты — помощник по учёту питания.
Твоя задача: из текста на русском языке извлечь список продуктов и их количество в граммах.

Правила:
- Возвращай ТОЛЬКО JSON массив, без пояснений
- Если граммы не указаны явно, используй типичную порцию (яйцо = 60г, банан = 120г)
- Для напитков переводи в мл (стакан воды = 250мл, чашка кофе = 200мл)
- Если продукт неоднозначен, включи его с пометкой "uncertain": true

Формат:
[{"name": "название на русском", "grams": число, "uncertain": false}]`;

const WORKOUT_SYSTEM_PROMPT = `Ты — помощник по учёту тренировок.
Твоя задача: из текста на русском языке извлечь данные о тренировке.

Правила:
- Возвращай ТОЛЬКО JSON объект, без пояснений
- type должен быть одним из: home, gym, run, bike, swim, other
- durationMinutes и perceivedEffort могут быть null, если не указаны
- exercises — массив упражнений с подходами

Формат:
{
  "name": "Название тренировки",
  "type": "gym",
  "durationMinutes": 60,
  "perceivedEffort": 7,
  "exercises": [
    {"name": "Жим лёжа", "sets": [{"reps": 10, "weightKg": 80}, {"reps": 8, "weightKg": 85}]}
  ]
}`;

class ClaudeProvider extends AIProvider {
  constructor() {
    super();
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async _callAPI(systemPrompt, input) {
    const response = await this.client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 800,
      system: systemPrompt,
      messages: [
        { role: 'user', content: input },
      ],
    });

    const raw = response.content[0].text.trim();
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    return JSON.parse(cleaned);
  }

  async parseFood(input) {
    return this._callAPI(FOOD_SYSTEM_PROMPT, input);
  }

  async parseWorkout(input) {
    return this._callAPI(WORKOUT_SYSTEM_PROMPT, input);
  }
}

module.exports = ClaudeProvider;


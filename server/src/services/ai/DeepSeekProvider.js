const axios = require('axios');
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

class DeepSeekProvider extends AIProvider {
  async _callAPI(systemPrompt, input) {
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        max_tokens: 800,
        messages: [
          { role: 'system', content: systemPrompt },
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
    // Strip markdown code fences if present (```json ... ```)
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

module.exports = DeepSeekProvider;


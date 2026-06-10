# NutriTrack — Техническое задание на MVP

> Версия 2.0 | Статус: готово к разработке

---

## Содержание

1. [Границы MVP](#1-границы-mvp)
2. [Технический стек и инфраструктура](#2-технический-стек-и-инфраструктура)
3. [Структура проекта](#3-структура-проекта)
4. [База данных — схемы MongoDB](#4-база-данных--схемы-mongodb)
5. [Backend API — эндпоинты](#5-backend-api--эндпоинты)
6. [Telegram-бот — сценарии и команды](#6-telegram-бот--сценарии-и-команды)
7. [Frontend — экраны и компоненты](#7-frontend--экраны-и-компоненты)
8. [AI Layer — абстракция провайдеров](#8-ai-layer--абстракция-провайдеров)
9. [Cross-Cutting Technical Requirements](#9-cross-cutting-technical-requirements)
10. [Аутентификация](#10-аутентификация)
11. [Переменные окружения](#11-переменные-окружения)
12. [Развёртывание](#12-развёртывание)
13. [Спринты разработки](#13-спринты-разработки)
14. [Критерии готовности MVP](#14-критерии-готовности-mvp)
15. [Future Features (Production / V2)](#15-future-features-production--v2)
16. [Architecture Decisions](#16-architecture-decisions)

---

## 1. Границы MVP

### Входит в MVP ✅

| Модуль | Функционал |
|--------|-----------|
| Авторизация | Telegram Login Widget, JWT-сессии |
| Питание | Ввод через бот (свободный текст), расчёт БЖУ+калории, история за день/неделю |
| Продукты | Личная база продуктов с ценами (ручной ввод цен), поиск |
| Рецепты | Создание составных блюд, расчёт на порцию |
| Тренировки | Ввод тренировки (свободный текст), расход калорий, история, просмотр тренировки |
| Самочувствие | Ежедневная оценка (5 уровней + теги), история |
| Вес | Ввод веса, график, скользящее среднее |
| Цели | Настройка Б/Ж/У/клетчатка/калории/вода/бюджет |
| Веб-дашборд | Прогресс за день, быстрый ввод, графики за 7 дней |
| Telegram-бот | Парсинг еды, тренировки, вес, самочувствие, напоминания |

### НЕ входит в MVP ❌

- Семейный режим (Family System) — см. [раздел 15](#15-future-features-production--v2)
- Шаблоны тренировок (Workout Templates) — см. [раздел 15](#15-future-features-production--v2)
- Аналитика прогресса упражнений, PR (Personal Records) — см. [раздел 15](#15-future-features-production--v2)
- OCR чеков и автоматическое распознавание цен
- Аналитика паттернов / причинно-следственные связи
- Рейтинг продуктов по €/г белка
- Сравнение цен по магазинам
- Умный список покупок
- Оптимизатор меню
- AI-коуч и недельные отчёты (только базовые рекомендации)
- Экспорт данных
- Интеграция с умными весами

---

## 2. Технический стек и инфраструктура

### Стек

```
Backend:
  Runtime:     Node.js 20 LTS
  Framework:   Express 4.x
  Language:    JavaScript (CommonJS)
  Bot:         Telegraf 4.x
  ODM:         Mongoose 8.x
  Auth:        JWT (jsonwebtoken) + crypto (Telegram hash validation)
  HTTP Client: axios
  Scheduler:   node-cron (для напоминаний)
  Validation:  zod
  Logging:     pino

Frontend:
  Framework:   React 18 + Vite
  Routing:     React Router v6
  State:       Zustand
  Charts:      Recharts
  HTTP:        axios
  Styles:      CSS Modules (без UI-библиотек в MVP)
  Forms:       react-hook-form

Database:
  MongoDB Atlas (Free M0 — 512MB)

AI:
  DeepSeek API (основной провайдер)
  Claude API (резервный провайдер — fallback)
  Абстракция: AI Provider Layer (см. раздел 8)

Hosting (бесплатный tier):
  Backend + Bot:  Railway (500 часов/мес бесплатно) или Render
  Frontend:       Vercel (бесплатно)
  Database:       MongoDB Atlas M0 (бесплатно)
```

### Почему именно этот стек

- **DeepSeek** вместо Claude для парсинга еды: значительно дешевле, скорость сопоставима, задача простая (извлечь продукты и граммы). AI Provider Layer позволяет переключиться за минуты
- **Zustand** вместо Redux: минимальный бойлерплейт, достаточно для MVP
- **CSS Modules** вместо Tailwind/MUI: полный контроль над стилями, нет зависимости от сборщика плагинов
- **node-cron** вместо BullMQ: для нескольких пользователей очередь не нужна, cron достаточен
- **pino** для логирования: минимальный overhead, структурированный JSON-вывод, поддержка уровней

---

## 3. Структура проекта

```
nutritrack/
├── server/                         # Backend
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js               # Подключение MongoDB
│   │   │   └── constants.js        # Константы БЖУ, калории
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Goal.js
│   │   │   ├── Product.js
│   │   │   ├── Recipe.js
│   │   │   ├── FoodLog.js
│   │   │   ├── Workout.js
│   │   │   ├── WellbeingLog.js
│   │   │   └── WeightLog.js
│   │   ├── routes/
│   │   │   ├── auth.js             # POST /auth/telegram
│   │   │   ├── goals.js            # GET/PUT /goals
│   │   │   ├── products.js         # CRUD /products
│   │   │   ├── recipes.js          # CRUD /recipes
│   │   │   ├── foodLogs.js         # CRUD /food-logs
│   │   │   ├── workouts.js         # CRUD /workouts
│   │   │   ├── wellbeing.js        # CRUD /wellbeing
│   │   │   ├── weight.js           # CRUD /weight
│   │   │   └── dashboard.js        # GET /dashboard/today, /dashboard/week
│   │   ├── middleware/
│   │   │   ├── auth.js             # JWT верификация
│   │   │   ├── validate.js         # Zod validation middleware
│   │   │   └── errorHandler.js     # Centralized error handler
│   │   ├── errors/
│   │   │   └── AppError.js         # Typed error classes
│   │   ├── services/
│   │   │   ├── ai/
│   │   │   │   ├── AIProvider.js       # Interface (JSDoc contract)
│   │   │   │   ├── DeepSeekProvider.js # Основной провайдер
│   │   │   │   ├── ClaudeProvider.js   # Резервный провайдер
│   │   │   │   ├── AIProviderFactory.js# Выбор провайдера из конфига
│   │   │   │   └── aiClient.js         # Retry, circuit breaker, fallback
│   │   │   ├── aiParser.js         # Парсинг еды через AI Layer
│   │   │   ├── nutritionCalc.js    # Расчёт БЖУ, калорий, стоимости
│   │   │   ├── caloriesBurned.js   # Расчёт расхода калорий на тренировке
│   │   │   └── reminderService.js  # Cron-задачи для напоминаний
│   │   ├── validation/
│   │   │   ├── foodLogSchemas.js   # Zod схемы для food-logs
│   │   │   ├── workoutSchemas.js   # Zod схемы для workouts
│   │   │   ├── weightSchemas.js    # Zod схемы для weight
│   │   │   └── wellbeingSchemas.js # Zod схемы для wellbeing
│   │   ├── bot/
│   │   │   ├── index.js            # Инициализация бота
│   │   │   ├── middleware/
│   │   │   │   └── userContext.js  # Добавляет user в ctx
│   │   │   └── handlers/
│   │   │       ├── start.js
│   │   │       ├── food.js         # Парсинг и сохранение еды
│   │   │       ├── workout.js
│   │   │       ├── weight.js
│   │   │       ├── wellbeing.js
│   │   │       ├── today.js
│   │   │       └── settings.js
│   │   ├── logger.js               # Pino instance
│   │   └── app.js                  # Express app
│   ├── .env
│   └── package.json
│
├── client/                         # Frontend
│   ├── src/
│   │   ├── api/
│   │   │   └── index.js            # Axios instance + все API-вызовы
│   │   ├── store/
│   │   │   ├── authStore.js        # Zustand: пользователь, токен
│   │   │   ├── dashboardStore.js
│   │   │   └── goalsStore.js
│   │   ├── pages/
│   │   │   ├── Dashboard/
│   │   │   ├── Diary/
│   │   │   ├── Workouts/
│   │   │   ├── Wellbeing/
│   │   │   ├── Weight/
│   │   │   ├── Products/
│   │   │   ├── Settings/
│   │   │   └── Login/
│   │   ├── components/
│   │   │   ├── NutrientBar/        # Прогресс-бар Б/Ж/У
│   │   │   ├── FoodEntry/          # Карточка приёма пищи
│   │   │   ├── WorkoutCard/
│   │   │   ├── WeightChart/
│   │   │   ├── CalorieRing/        # Кольцо калорий
│   │   │   ├── QuickAdd/           # Форма быстрого добавления
│   │   │   └── Layout/             # Navbar, Sidebar
│   │   ├── hooks/
│   │   │   ├── useToday.js
│   │   │   └── useDateNav.js       # Навигация по дням
│   │   └── main.jsx
│   └── package.json
│
└── README.md
```

---

## 4. База данных — схемы MongoDB

### 4.1 User

```javascript
// models/User.js
const UserSchema = new Schema({
  telegramId:   { type: String, required: true, unique: true },
  firstName:    { type: String, required: true },
  lastName:     { type: String },
  username:     { type: String },
  photoUrl:     { type: String },
  language:     { type: String, default: 'ru' },
  timezone:     { type: String, default: 'Europe/Rome' },
  weightKg:     { type: Number },              // текущий вес для расчёта калорий
  heightCm:     { type: Number },
  botState:     { type: String, default: 'idle' }, // для multi-step диалогов
  botStateData: { type: Schema.Types.Mixed },      // временные данные диалога
  createdAt:    { type: Date, default: Date.now },
});
```

> **Изменение v2.0:** Удалено поле `familyGroupId` — семейный режим перенесён в Production/V2.

### 4.2 Goal

```javascript
// models/Goal.js
const GoalSchema = new Schema({
  userId:       { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  protein:      { type: Number, default: 100 },   // г/день
  fat:          { type: Number, default: 100 },
  carbs:        { type: Number, default: 200 },
  fiber:        { type: Number, default: 30 },
  calories:     { type: Number, default: 2100 },
  water:        { type: Number, default: 2000 },  // мл/день
  weeklyBudget: { type: Number, default: null },   // €/неделю, опционально
  updatedAt:    { type: Date, default: Date.now },
});
```

### 4.3 Product

```javascript
// models/Product.js
const ProductSchema = new Schema({
  userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name:     { type: String, required: true },
  aliases:  [{ type: String }],   // ['курица', 'куриное филе', 'chicken']
  per100g: {
    protein:  { type: Number, default: 0 },
    fat:      { type: Number, default: 0 },
    carbs:    { type: Number, default: 0 },
    fiber:    { type: Number, default: 0 },
    calories: { type: Number, default: 0 },
  },
  currentPriceEur: { type: Number, default: null },   // € за кг
  priceHistory: [{
    priceEur: Number,
    store:    String,
    date:     { type: Date, default: Date.now },
  }],
  category: {
    type: String,
    enum: ['meat', 'fish', 'dairy', 'grain', 'vegetable', 'fruit',
           'drink', 'drink_undesirable', 'supplement', 'other'],
    default: 'other',
  },
  createdAt: { type: Date, default: Date.now },
});

// Индекс для поиска
ProductSchema.index({ userId: 1, name: 'text', aliases: 'text' });
```

> **Изменение v2.0:** Удалено поле `isSharedWithFamily` — семейный режим перенесён в Production/V2.

### 4.4 Recipe

```javascript
// models/Recipe.js
const RecipeSchema = new Schema({
  userId:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name:          { type: String, required: true },
  totalServings: { type: Number, required: true, min: 1 },
  ingredients: [{
    productId:   { type: Schema.Types.ObjectId, ref: 'Product' },
    productName: String,   // денормализовано для быстрого отображения
    grams:       Number,
  }],
  // Кэшированные расчёты (пересчитываются при изменении рецепта)
  totalNutrients: {
    protein: Number, fat: Number, carbs: Number,
    fiber: Number, calories: Number,
  },
  perServingNutrients: {
    protein: Number, fat: Number, carbs: Number,
    fiber: Number, calories: Number,
  },
  totalCostEur:      { type: Number, default: null },
  perServingCostEur: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now },
});
```

### 4.5 FoodLog

```javascript
// models/FoodLog.js
const FoodItemSchema = new Schema({
  productId:   { type: Schema.Types.ObjectId, ref: 'Product', default: null },
  recipeId:    { type: Schema.Types.ObjectId, ref: 'Recipe', default: null },
  name:        { type: String, required: true },
  grams:       { type: Number, required: true },
  servings:    { type: Number, default: null },   // для рецептов
  protein:     Number,
  fat:         Number,
  carbs:       Number,
  fiber:       Number,
  calories:    Number,
  costEur:     { type: Number, default: null },
}, { _id: false });

const FoodLogSchema = new Schema({
  userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date:      { type: String, required: true },   // 'YYYY-MM-DD'
  loggedAt:  { type: Date, default: Date.now },  // реальное время ввода
  mealType:  {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    default: 'snack',
  },
  items:     [FoodItemSchema],
  totals: {
    protein: Number, fat: Number, carbs: Number,
    fiber: Number, calories: Number, costEur: Number,
  },
  source:    { type: String, enum: ['telegram', 'web'], default: 'telegram' },
  rawInput:  { type: String },   // оригинальный текст от пользователя
});

FoodLogSchema.index({ userId: 1, date: -1 });
```

### 4.6 Workout

```javascript
// models/Workout.js
const SetSchema = new Schema({
  reps:        { type: Number },
  weightKg:    { type: Number, default: 0 },
  durationSec: { type: Number },   // для кардио-упражнений
}, { _id: false });

const ExerciseSchema = new Schema({
  name:  { type: String, required: true },
  sets:  [SetSchema],
  notes: String,
}, { _id: false });

const WorkoutSchema = new Schema({
  userId:          { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date:            { type: String, required: true },
  name:            { type: String, required: true },
  type:            { type: String, enum: ['home', 'gym', 'run', 'bike', 'swim', 'other'], default: 'home' },
  exercises:       [ExerciseSchema],
  durationMinutes: { type: Number },
  perceivedEffort: { type: Number, min: 1, max: 10 },
  caloriesBurned:  { type: Number, default: 0 },
  notes:           String,
  createdAt:       { type: Date, default: Date.now },
});

WorkoutSchema.index({ userId: 1, date: -1 });
```

> **Изменение v2.0:** Удалено поле `templateId` — шаблоны тренировок перенесены в Production/V2.

### 4.7 WellbeingLog

```javascript
// models/WellbeingLog.js
const WellbeingSchema = new Schema({
  userId:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date:    { type: String, required: true },   // 'YYYY-MM-DD', уникально
  overall: { type: String, enum: ['great', 'good', 'ok', 'bad', 'sick'], required: true },
  energy:  { type: Number, min: 1, max: 5, default: null },
  sleep:   { type: Number, min: 1, max: 5, default: null },
  stress:  { type: Number, min: 1, max: 5, default: null },
  mood:    { type: Number, min: 1, max: 5, default: null },
  symptoms: [{
    type: String,
    enum: ['back_pain', 'joint_pain', 'fatigue', 'headache', 'stomach', 'other'],
  }],
  notes:   String,
});

WellbeingSchema.index({ userId: 1, date: -1 });
WellbeingSchema.index({ userId: 1, date: 1 }, { unique: true });
```

### 4.8 WeightLog

```javascript
// models/WeightLog.js
const WeightLogSchema = new Schema({
  userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date:     { type: String, required: true },
  weightKg: { type: Number, required: true },
  loggedAt: { type: Date, default: Date.now },
});

WeightLogSchema.index({ userId: 1, date: -1 });
WeightLogSchema.index({ userId: 1, date: 1 }, { unique: true });
```

---

## 5. Backend API — эндпоинты

Все роуты (кроме `/auth/*`) требуют заголовок: `Authorization: Bearer <JWT>`

Все входящие данные валидируются через Zod (см. [раздел 9](#9-cross-cutting-technical-requirements)).

### 5.1 Auth

```
POST /api/auth/telegram
  Body: { id, first_name, last_name, username, photo_url, hash, auth_date }
  Описание: Валидирует hash от Telegram Login Widget, создаёт/обновляет User,
            возвращает JWT-токен
  Response: { token, user: { id, firstName, telegramId } }

POST /api/auth/bot-login
  Body: { telegramId, botSecret }
  Описание: Внутренний эндпоинт для бота (не публичный)
  Response: { token }
```

### 5.2 Goals

```
GET  /api/goals
  Response: GoalObject

PUT  /api/goals
  Body: { protein?, fat?, carbs?, fiber?, calories?, water?, weeklyBudget? }
  Response: GoalObject
```

### 5.3 Products

```
GET  /api/products?search=курица&limit=20&offset=0
  Response: { products: [...], total: N }

GET  /api/products/:id
  Response: ProductObject

POST /api/products
  Body: { name, aliases[], per100g: {protein, fat, carbs, fiber, calories},
          currentPriceEur?, category? }
  Response: ProductObject

PUT  /api/products/:id
  Body: частичное обновление
  Response: ProductObject

DELETE /api/products/:id

POST /api/products/:id/price
  Body: { priceEur, store }
  Описание: Добавляет запись в priceHistory, обновляет currentPriceEur
  Response: ProductObject
```

### 5.4 Recipes

```
GET  /api/recipes?limit=20&offset=0
  Response: { recipes: [...], total: N }

GET  /api/recipes/:id
  Response: RecipeObject

POST /api/recipes
  Body: { name, totalServings, ingredients: [{productId, grams}] }
  Описание: Автоматически рассчитывает totalNutrients и perServingNutrients
  Response: RecipeObject

PUT  /api/recipes/:id
DELETE /api/recipes/:id
```

### 5.5 Food Logs

```
GET  /api/food-logs?date=2025-05-31
  Response: { logs: [...], dailyTotals: {protein, fat, carbs, fiber, calories, costEur} }

GET  /api/food-logs/week?startDate=2025-05-25
  Response: { days: [{ date, totals }] }   // 7 дней

POST /api/food-logs
  Body: { date, mealType?, items: [{productId?, recipeId?, name, grams, servings?}] }
  Описание: Рассчитывает нутриенты на основе productId/recipeId и граммов
  Response: FoodLogObject

PUT  /api/food-logs/:id
  Body: частичное обновление items
  Response: FoodLogObject

DELETE /api/food-logs/:id

POST /api/food-logs/parse
  Body: { text: "съел 200г куриной грудки и 150г риса" }
  Описание: AI Layer парсит текст → возвращает структурированный список.
            При недоступности AI возвращает graceful degradation (см. раздел 8).
  Response: { parsed: [{name, grams, matchedProductId?, confidence}] }

POST /api/food-logs/repeat
  Body: { sourceDate: "2025-05-30", mealType: "breakfast", targetDate: "2025-05-31" }
  Описание: Копирует указанный приём пищи на новую дату
  Response: FoodLogObject
```

### 5.6 Workouts

```
GET  /api/workouts?date=2025-05-31
GET  /api/workouts?startDate=2025-05-25&endDate=2025-05-31
  Response: [WorkoutObject]

POST /api/workouts
  Body: { date, name, type, exercises, durationMinutes, perceivedEffort, notes? }
  Описание: Рассчитывает caloriesBurned
  Response: WorkoutObject

PUT  /api/workouts/:id
DELETE /api/workouts/:id
```

> **Изменение v2.0:** Удалены эндпоинты шаблонов тренировок (`/workouts/templates`) и истории упражнений (`/workouts/exercise-history/:name`) — перенесены в Production/V2.

### 5.7 Wellbeing

```
GET  /api/wellbeing?date=2025-05-31
GET  /api/wellbeing?startDate=2025-05-01&endDate=2025-05-31
  Response: [WellbeingObject]

POST /api/wellbeing
  Body: { date, overall, energy?, sleep?, stress?, mood?, symptoms?[], notes? }
  Response: WellbeingObject

PUT  /api/wellbeing/:id
```

### 5.8 Weight

```
GET  /api/weight?limit=30
  Response: { logs: [WeightObject], movingAverage: [{ date, avg }] }
  Описание: movingAverage — скользящее среднее за 7 дней

POST /api/weight
  Body: { date, weightKg }
  Response: WeightObject

PUT  /api/weight/:id
```

### 5.9 Dashboard

```
GET  /api/dashboard/today
  Response: {
    date: "2025-05-31",
    goals: GoalObject,
    foodTotals: { protein, fat, carbs, fiber, calories, costEur },
    remaining:  { protein, fat, carbs, fiber, calories },
    workout:    WorkoutObject | null,
    wellbeing:  WellbeingObject | null,
    weight:     WeightObject | null,
    waterMl:    Number,
    recentMeals: [последние 3 FoodLog],
    repeatSuggestion: {   // "Повторить как вчера?"
      mealType: "breakfast",
      items: [...],
    } | null,
  }

GET  /api/dashboard/week
  Response: {
    days: [{
      date, foodTotals, hasWorkout, wellbeing, weight,
    }],
    weeklyFoodCost: Number,
    avgNutrients: { protein, fat, carbs, fiber, calories },
    goalsCompletion: { protein: 87, fat: 92, ... },  // % выполнения
  }
```

---

## 6. Telegram-бот — сценарии и команды

### 6.1 Команды

```
/start          — первый запуск, онбординг
/help           — справка с кнопками
/today          — прогресс за сегодня
/goals          — просмотр/изменение целей
/weight [кг]    — записать вес (пример: /weight 82.4)
/train          — начать ввод тренировки
/feel           — оценить самочувствие
/repeat         — повторить последний приём пищи
/stats          — краткая статистика за неделю
/cancel         — отменить текущий диалог
```

### 6.2 Свободный текст (основной режим)

Если бот получает текстовое сообщение вне команды и вне активного диалога — всегда интерпретирует как ввод еды через AI Layer.

### 6.3 Онбординг (/start для нового пользователя)

```
Шаг 1: Приветствие
  Бот: "Привет, [Имя]! Я NutriTrack — помогу отслеживать питание, тренировки и самочувствие.
        Давай настроим твои цели. Это займёт 2 минуты."
  Кнопки: [Начать настройку] [Пропустить, настрою потом]

Шаг 2: Вес и рост (для расчёта норм)
  Бот: "Сколько ты весишь? (введи цифру в кг, например: 82)"
  → После ввода: "Отлично! Рост? (например: 178)"

Шаг 3: Предложение целей
  Бот: "На основе твоих данных предлагаю стартовые цели:
        • Белки: 100г/день
        • Жиры: 100г/день
        • Углеводы: 200г/день
        • Клетчатка: 30г/день
        • Калории: ~2100 ккал
        Всё верно?"
  Кнопки: [Принять ✅] [Изменить вручную]

Шаг 4: Напоминания
  Бот: "Включить утреннее напоминание в 8:00?"
  Кнопки: [Да, в 8:00] [Выбрать время] [Не нужно]

Шаг 5: Готово
  Бот: "Настройка завершена! Просто пиши мне что ты съел, и я всё запишу.
        Например: 'съел 3 яйца и 150г гречки'"
```

### 6.4 Ввод еды (основной сценарий)

```
Пользователь: "съел 200г куриной грудки и 150г риса"

1. Бот показывает "⏳ Считаю..."
2. Вызов /api/food-logs/parse (AI Layer → DeepSeek)
3. Получен результат: [{name: "куриная грудка", grams: 200, matchedProductId: "xxx"},
                       {name: "рис", grams: 150, matchedProductId: "yyy"}]
4. Расчёт нутриентов
5. Сохранение в FoodLog

Бот отвечает:
  ✅ Записано:
  • Куриная грудка 200г — Б:47г Ж:4г У:1г 226 ккал
  • Рис 150г — Б:4г Ж:1г У:51г 195 ккал
  ──────────────────
  Итого: Б:51г Ж:5г У:52г | 421 ккал

  📊 Прогресс сегодня:
  Белки:    ████████░░ 78г / 100г
  Жиры:     ████░░░░░░ 42г / 100г
  Углеводы: ██████░░░░ 123г / 200г

  [✏️ Изменить] [🔄 Повторить завтра]
```

#### Нераспознанный продукт

```
Пользователь: "поел творожной запеканки"

Бот: "Не нашёл 'творожная запеканка' в твоих продуктах. Это:"
Кнопки:
  [🍽 Мой рецепт (рассчитать по ингредиентам)]
  [📝 Ввести БЖУ вручную]
  [❌ Пропустить этот продукт]

→ При выборе "Ввести вручную":
Бот: "Введи граммы и КБЖУ через пробел: [граммы] [ккал] [белки] [жиры] [углеводы]
      Пример: 200 220 18 8 15"
```

#### AI недоступен (Graceful Degradation)

```
Пользователь: "съел куриную грудку с рисом"

[AI провайдеры недоступны или исчерпаны ретраи]

Бот: "Не удалось автоматически распознать еду. Введи вручную:
      1. Название продукта
      2. Количество грамм

      Или попробуй позже."
Кнопки: [📝 Ввести вручную] [🔁 Попробовать снова]
```

#### Ресторанная еда

```
Пользователь: "поел пиццу"

Бот: "Пицца? Выбери или уточни:"
Кнопки (из базы пользователя):
  [Пицца Маргарита ~350г]
  [Пицца другая...]
  [Ввести граммы вручную]
```

### 6.5 Ввод тренировки

```
/train → Бот предлагает свободный ввод:

Бот: "Опиши тренировку: упражнения, подходы, повторения, длительность."
     "Например: Подтягивания 3×10, отжимания 3×20, 45 минут, сложность 7"

→ После ввода пользователь пишет результаты:
"Подтягивания 3×10, отжимания 3×20, приседания с гирей 32кг 4×15, 45 минут, сложность 7"

Бот парсит через AI Layer и отвечает:
  💪 Тренировка сохранена!
  • Подтягивания: 3×10
  • Отжимания: 3×20
  • Присед с гирей 32кг: 4×15 (объём: 1920 кг)
  Длительность: 45 мин | Сложность: 7/10
  Расход калорий: ~310 ккал

  Дневная норма скорректирована: +310 ккал
  Можно съесть ещё: Б+25г / У+30г
```

### 6.6 Оценка самочувствия

```
/feel → Бот присылает Inline Keyboard:

Бот: "Как себя чувствуешь сегодня?"
Кнопки в ряд:
  [😁 Отлично] [🙂 Хорошо] [😐 Нормально] [😔 Плохо] [🤒 Болею]

→ После выбора "Хорошо":
Бот: "Хорошо! Уточнить?"
Кнопки (multi-select):
  [Энергия 💡] [Сон 😴] [Стресс 😤] [Настроение 🎭]
  [Боль в спине] [Усталость] [Пропустить]

→ При выборе "Сон 😴":
Бот: "Качество сна?"
Кнопки: [⭐ 1] [⭐⭐ 2] [⭐⭐⭐ 3] [⭐⭐⭐⭐ 4] [⭐⭐⭐⭐⭐ 5]
```

### 6.7 Ответ на /today

```
Бот:
  📅 Сегодня, 31 мая

  🍽 Питание:
  Белки:    ████████░░  78г / 100г  (78%)
  Жиры:     █████░░░░░  52г / 100г  (52%)
  Углеводы: ██████░░░░ 124г / 200г  (62%)
  Клетчатка:████░░░░░░  12г / 30г   (40%)
  Калории:  1289 / 2100 ккал

  💪 Тренировка: ✅ 45 мин
  ⚖️ Вес: не внесён
  😊 Самочувствие: Хорошо

  [🍽 Добавить еду] [⚖️ Взвеситься]
```

### 6.8 Напоминания (node-cron)

```javascript
// reminderService.js
// Утреннее напоминание — 8:00 по Rome (UTC+2)
cron.schedule('0 6 * * *', async () => {
  const users = await User.find({ 'reminders.morning': true });
  for (const user of users) {
    const yesterday = await getDayStats(user._id, getYesterday());
    await bot.telegram.sendMessage(user.telegramId, formatMorningMessage(yesterday));
  }
});

// Вечернее напоминание — 21:00
cron.schedule('0 19 * * *', async () => {
  // Проверяем, кто не оценил самочувствие за сегодня
  const usersWithoutWellbeing = await findUsersWithoutWellbeing(today());
  for (const user of usersWithoutWellbeing) {
    await bot.telegram.sendMessage(user.telegramId, '...', wellbeingKeyboard());
  }
});
```

---

## 7. Frontend — экраны и компоненты

### 7.1 Dashboard (/)

**Секции:**
1. Шапка: имя пользователя, дата, кнопка «Добавить»
2. Кольцо калорий (Recharts RadialBarChart): потреблено / цель / сожжено
3. Прогресс-бары БЖУ + клетчатка (4 бара)
4. Блок «Быстрые действия»: + Еда / + Тренировка / + Вес
5. Последние приёмы пищи (3 штуки, с кнопкой «Повторить»)
6. Мини-карточки: Тренировка, Самочувствие, Вода
7. График веса за 14 дней (Recharts LineChart)

**Ключевые состояния:**
- Пусто (первый день): онбординг-подсказки вместо пустых блоков
- Тренировочный день: скорректированная норма калорий

### 7.2 Дневник питания (/diary)

**Верхняя часть:** Навигация по датам (← Вчера | Сегодня | Завтра →)

**Секции по приёмам пищи:**
```
Завтрак        [+ Добавить]
  ├─ Яйца 3 шт — 180г — Б:19г Ж:15г У:1г — 210 ккал  [✏️] [🗑]
  └─ Гречка    — 150г — Б:8г  Ж:2г  У:41г — 215 ккал  [✏️] [🗑]
  Итого:                 Б:27г Ж:17г У:42г — 425 ккал

Обед           [+ Добавить]
  └─ (пусто)  [🔄 Повторить как вчера]

Ужин           [+ Добавить]
  ...

Перекусы       [+ Добавить]
  ...

──────────────────────────────
Итого за день: Б:78г Ж:52г У:124г Кл:12г | 1289 ккал
```

**Форма добавления (модальное окно):**
- Поле поиска продукта (debounce 300ms → GET /products?search=)
- Список результатов с карточками
- После выбора продукта: поле граммов
- Кнопка «Свободный текст» → textarea → AI Layer

### 7.3 Тренировки (/workouts)

**Список тренировок** с группировкой по неделям.

**Детали тренировки:**
- Упражнения с подходами в таблице
- Расход калорий, длительность, сложность

> **Изменение v2.0:** Аналитика прогресса упражнений, графики объёма и PR перенесены в Production/V2.

### 7.4 Самочувствие (/wellbeing)

- Тепловая карта за 30 дней (цвет = оценка самочувствия)
- График настроения/энергии/сна в динамике
- Форма добавления за выбранный день

### 7.5 Вес (/weight)

- LineChart: реальный вес (точки) + скользящее среднее 7 дней (линия)
- Период: 2 недели / месяц / 3 месяца (переключатель)
- Таблица записей с редактированием

### 7.6 База продуктов (/products)

- Список с поиском
- Карточка продукта: БЖУ/100г, текущая цена, история цен
- Форма создания/редактирования
- Быстрое добавление через «+»

### 7.7 Настройки (/settings)

- Цели по БЖУ (форма с живым пересчётом калорий)
- Бюджет на питание (€/неделю)
- Время напоминаний
- Данные профиля (вес, рост для расчёта норм)

---

## 8. AI Layer — абстракция провайдеров

### 8.1 Цель

Смена AI-провайдера не должна затрагивать бизнес-логику. Вся работа с AI изолирована в слое `services/ai/`. Переключение провайдера — изменение одной переменной окружения.

### 8.2 Интерфейс провайдера

```javascript
// services/ai/AIProvider.js
/**
 * @typedef {Object} ParsedFoodItem
 * @property {string} name
 * @property {number} grams
 * @property {boolean} uncertain
 */

/**
 * AIProvider interface (JSDoc contract)
 * @interface
 */
class AIProvider {
  /**
   * @param {string} input - Свободный текст от пользователя
   * @returns {Promise<ParsedFoodItem[]>}
   */
  async parseFood(input) {
    throw new Error('Not implemented');
  }
}

module.exports = AIProvider;
```

### 8.3 Реализации провайдеров

```javascript
// services/ai/DeepSeekProvider.js
const axios = require('axios');
const AIProvider = require('./AIProvider');

const FOOD_PARSE_SYSTEM_PROMPT = `Ты — помощник по учёту питания.
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
          { role: 'system', content: FOOD_PARSE_SYSTEM_PROMPT },
          { role: 'user', content: input },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const raw = response.data.choices[0].message.content.trim();
    return JSON.parse(raw);
  }
}

module.exports = DeepSeekProvider;
```

```javascript
// services/ai/ClaudeProvider.js
const Anthropic = require('@anthropic-ai/sdk');
const AIProvider = require('./AIProvider');

const FOOD_PARSE_SYSTEM_PROMPT = `...`; // тот же промпт

class ClaudeProvider extends AIProvider {
  constructor() {
    super();
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async parseFood(input) {
    const response = await this.client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 500,
      system: FOOD_PARSE_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: input }],
    });

    const raw = response.content[0].text.trim();
    return JSON.parse(raw);
  }
}

module.exports = ClaudeProvider;
```

### 8.4 Provider Factory

```javascript
// services/ai/AIProviderFactory.js
const DeepSeekProvider = require('./DeepSeekProvider');
const ClaudeProvider = require('./ClaudeProvider');

const PROVIDERS = {
  deepseek: DeepSeekProvider,
  claude:   ClaudeProvider,
};

function createProvider(name) {
  const ProviderClass = PROVIDERS[name];
  if (!ProviderClass) {
    throw new Error(`Unknown AI provider: ${name}`);
  }
  return new ProviderClass();
}

module.exports = { createProvider };
```

### 8.5 AI Client — Retry, Fallback, Circuit Breaker

```javascript
// services/ai/aiClient.js
const { createProvider } = require('./AIProviderFactory');
const logger = require('../../logger');

const PRIMARY_PROVIDER   = process.env.AI_PROVIDER         || 'deepseek';
const FALLBACK_PROVIDER  = process.env.AI_FALLBACK_PROVIDER || 'claude';
const MAX_RETRIES        = 2;
const REQUEST_TIMEOUT_MS = 10000;

async function withRetry(fn, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      logger.warn({ attempt, err: err.message }, 'AI request failed, retrying');
      await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
    }
  }
}

async function parseFood(input) {
  const primary = createProvider(PRIMARY_PROVIDER);

  try {
    return await withRetry(() => primary.parseFood(input));
  } catch (primaryErr) {
    logger.error({ provider: PRIMARY_PROVIDER, err: primaryErr.message }, 'Primary AI provider failed');

    if (FALLBACK_PROVIDER && FALLBACK_PROVIDER !== PRIMARY_PROVIDER) {
      const fallback = createProvider(FALLBACK_PROVIDER);
      try {
        logger.info({ provider: FALLBACK_PROVIDER }, 'Switching to fallback AI provider');
        return await withRetry(() => fallback.parseFood(input));
      } catch (fallbackErr) {
        logger.error({ provider: FALLBACK_PROVIDER, err: fallbackErr.message }, 'Fallback AI provider also failed');
      }
    }

    // Graceful degradation — возвращаем null, обработчик даст пользователю инструкцию
    return null;
  }
}

module.exports = { parseFood };
```

### 8.6 Graceful Degradation

Если `aiClient.parseFood()` вернул `null`:

- API `/food-logs/parse` возвращает `{ parsed: null, degraded: true }`
- Бот отображает сообщение:

```
Не удалось автоматически распознать еду.

Введи вручную:
1. Название продукта
2. Количество грамм

Или попробуй позже.
```

### 8.7 Кэширование

Часто встречающиеся запросы кэшируются в памяти (Map) на 24 часа:

```javascript
// services/aiParser.js
const parseCache = new Map(); // key: нормализованный текст, value: результат

function getCacheKey(text) {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}
```

### 8.8 Расчёт нутриентов (без AI)

```javascript
// services/nutritionCalc.js

function calcItemNutrients(product, grams) {
  const ratio = grams / 100;
  return {
    protein:  +(product.per100g.protein  * ratio).toFixed(1),
    fat:      +(product.per100g.fat      * ratio).toFixed(1),
    carbs:    +(product.per100g.carbs    * ratio).toFixed(1),
    fiber:    +(product.per100g.fiber    * ratio).toFixed(1),
    calories: +(product.per100g.calories * ratio).toFixed(0),
    costEur:  product.currentPriceEur
                ? +((product.currentPriceEur / 1000) * grams).toFixed(2)
                : null,
  };
}

function calcTotals(items) {
  return items.reduce((acc, item) => ({
    protein:  +(acc.protein  + item.protein).toFixed(1),
    fat:      +(acc.fat      + item.fat).toFixed(1),
    carbs:    +(acc.carbs    + item.carbs).toFixed(1),
    fiber:    +(acc.fiber    + item.fiber).toFixed(1),
    calories: acc.calories   + item.calories,
    costEur:  acc.costEur !== null && item.costEur !== null
                ? +(acc.costEur + item.costEur).toFixed(2)
                : null,
  }), { protein: 0, fat: 0, carbs: 0, fiber: 0, calories: 0, costEur: 0 });
}
```

### 8.9 Расчёт калорий от тренировки

```javascript
// services/caloriesBurned.js
// MET (Metabolic Equivalent of Task) формула:
// Калории = MET × вес_кг × время_часы

const MET_VALUES = {
  home: 4.5,
  gym:  5.5,
  run:  8.0,
  bike: 7.5,
  swim: 7.0,
};

function calcCaloriesBurned(type, durationMinutes, userWeightKg) {
  const met = MET_VALUES[type] || 4.0;
  return Math.round(met * userWeightKg * (durationMinutes / 60));
}
```

---

## 9. Cross-Cutting Technical Requirements

### 9.1 Zod Validation

Все входящие данные в API валидируются через Zod до попадания в контроллер.

#### Схемы валидации

```javascript
// validation/foodLogSchemas.js
const { z } = require('zod');

const FoodItemSchema = z.object({
  productId: z.string().optional(),
  recipeId:  z.string().optional(),
  name:      z.string().min(1).max(200),
  grams:     z.number().positive().max(10000),
  servings:  z.number().positive().optional(),
});

const CreateFoodLogSchema = z.object({
  date:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
  items:    z.array(FoodItemSchema).min(1),
});

const ParseFoodSchema = z.object({
  text: z.string().min(1).max(1000),
});

module.exports = { CreateFoodLogSchema, ParseFoodSchema };
```

```javascript
// validation/workoutSchemas.js
const { z } = require('zod');

const SetSchema = z.object({
  reps:        z.number().int().positive().optional(),
  weightKg:    z.number().min(0).optional(),
  durationSec: z.number().positive().optional(),
});

const ExerciseSchema = z.object({
  name:  z.string().min(1).max(100),
  sets:  z.array(SetSchema).optional(),
  notes: z.string().max(500).optional(),
});

const CreateWorkoutSchema = z.object({
  date:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  name:            z.string().min(1).max(100),
  type:            z.enum(['home', 'gym', 'run', 'bike', 'swim', 'other']).optional(),
  exercises:       z.array(ExerciseSchema).optional(),
  durationMinutes: z.number().positive().max(600).optional(),
  perceivedEffort: z.number().int().min(1).max(10).optional(),
  notes:           z.string().max(1000).optional(),
});

module.exports = { CreateWorkoutSchema };
```

```javascript
// validation/weightSchemas.js
const { z } = require('zod');

const CreateWeightSchema = z.object({
  date:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weightKg: z.number().positive().min(20).max(300),
});

module.exports = { CreateWeightSchema };
```

```javascript
// validation/wellbeingSchemas.js
const { z } = require('zod');

const CreateWellbeingSchema = z.object({
  date:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  overall:  z.enum(['great', 'good', 'ok', 'bad', 'sick']),
  energy:   z.number().int().min(1).max(5).optional(),
  sleep:    z.number().int().min(1).max(5).optional(),
  stress:   z.number().int().min(1).max(5).optional(),
  mood:     z.number().int().min(1).max(5).optional(),
  symptoms: z.array(z.enum(['back_pain', 'joint_pain', 'fatigue', 'headache', 'stomach', 'other'])).optional(),
  notes:    z.string().max(1000).optional(),
});

module.exports = { CreateWellbeingSchema };
```

#### Validate middleware

```javascript
// middleware/validate.js
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: result.error.errors,
      });
    }
    req.body = result.data;
    next();
  };
}

function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: result.error.errors,
      });
    }
    req.query = result.data;
    next();
  };
}

module.exports = { validate, validateQuery };
```

**Формат ошибки валидации:**

```json
{
  "error": "VALIDATION_ERROR",
  "details": [
    { "path": ["grams"], "message": "Number must be positive" }
  ]
}
```

---

### 9.2 Centralized Error Handler

#### Typed Errors

```javascript
// errors/AppError.js
class AppError extends Error {
  constructor(code, message, statusCode = 500) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

class ValidationError extends AppError {
  constructor(message) { super('VALIDATION_ERROR', message, 400); }
}

class AuthenticationError extends AppError {
  constructor(message = 'Unauthorized') { super('AUTHENTICATION_ERROR', message, 401); }
}

class AuthorizationError extends AppError {
  constructor(message = 'Forbidden') { super('AUTHORIZATION_ERROR', message, 403); }
}

class NotFoundError extends AppError {
  constructor(resource) { super('NOT_FOUND', `${resource} not found`, 404); }
}

class ExternalServiceError extends AppError {
  constructor(service, message) {
    super('EXTERNAL_SERVICE_ERROR', `${service}: ${message}`, 502);
  }
}

class AIParsingError extends AppError {
  constructor(message = 'AI parsing failed') { super('AI_PARSING_ERROR', message, 502); }
}

module.exports = {
  AppError, ValidationError, AuthenticationError,
  AuthorizationError, NotFoundError, ExternalServiceError, AIParsingError,
};
```

#### Global Error Middleware

```javascript
// middleware/errorHandler.js
const logger = require('../logger');
const { AppError } = require('../errors/AppError');

function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    logger.warn({ code: err.code, statusCode: err.statusCode, path: req.path }, err.message);
    return res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
    });
  }

  // Неожиданные ошибки
  logger.error({ err, path: req.path }, 'Unhandled error');
  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'Something went wrong',
  });
}

module.exports = errorHandler;
```

**Единый формат ответа ошибки:**

```json
{
  "error": "ERROR_CODE",
  "message": "Human readable message"
}
```

---

### 9.3 Logging

Используется **pino** — структурированное JSON-логирование с минимальным overhead.

```javascript
// logger.js
const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: ['req.headers.authorization', 'body.hash', 'body.token'],
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});

module.exports = logger;
```

#### Что логируется

| Событие | Уровень |
|---------|---------|
| Входящий API-запрос | `info` |
| Успешный ответ API | `info` |
| Ошибка валидации | `warn` |
| Ошибка аутентификации | `warn` |
| Ошибка AI-провайдера | `error` |
| Переключение на fallback-провайдер | `info` |
| Telegram-событие (команда) | `info` |
| Ошибка базы данных | `error` |
| Неожиданное исключение | `error` |

#### Что НЕ логируется (по безопасности)

- JWT-токены
- Telegram hash
- Персональные данные пользователя (имя, telegramId логируется только как `userId`)
- Пароли и секреты

#### Request Logging Middleware

```javascript
// middleware/requestLogger.js
const logger = require('../logger');

function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      ms: Date.now() - start,
    }, 'request');
  });
  next();
}

module.exports = requestLogger;
```

---

## 10. Аутентификация

### Telegram Login Widget (для веб-приложения)

```html
<!-- Кнопка на странице /login -->
<script
  async src="https://telegram.org/js/telegram-widget.js?22"
  data-telegram-login="YOUR_BOT_USERNAME"
  data-size="large"
  data-onauth="onTelegramAuth(user)"
  data-request-access="write">
</script>
```

```javascript
// client/pages/Login/index.jsx
function onTelegramAuth(user) {
  // user = { id, first_name, last_name, username, photo_url, hash, auth_date }
  const { token } = await api.post('/auth/telegram', user);
  authStore.setToken(token);
  navigate('/');
}
```

### Валидация на сервере

```javascript
// routes/auth.js
function validateTelegramHash(data) {
  const { hash, ...rest } = data;
  const dataCheckString = Object.keys(rest)
    .sort()
    .map(k => `${k}=${rest[k]}`)
    .join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(process.env.BOT_TOKEN)
    .digest();

  const expectedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  return hash === expectedHash;
}
```

### JWT

```javascript
// Токен истекает через 30 дней
const token = jwt.sign(
  { userId: user._id, telegramId: user.telegramId },
  process.env.JWT_SECRET,
  { expiresIn: '30d' }
);
```

---

## 11. Переменные окружения

### server/.env

```bash
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/nutritrack

# Telegram
BOT_TOKEN=1234567890:ABCDEFghijklmnoP-qrstuvwxyz
BOT_SECRET=random_internal_secret_32chars

# JWT
JWT_SECRET=your_very_long_random_jwt_secret_here

# AI Providers
AI_PROVIDER=deepseek                  # основной провайдер
AI_FALLBACK_PROVIDER=claude           # резервный провайдер
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx  # нужен только если используется как fallback

# App
PORT=3001
NODE_ENV=development
WEBAPP_URL=https://nutritrack.vercel.app

# Logging
LOG_LEVEL=info                        # debug | info | warn | error

# Timezone
DEFAULT_TIMEZONE=Europe/Rome
```

### client/.env

```bash
VITE_API_URL=http://localhost:3001/api
VITE_BOT_USERNAME=NutriTrackBot
```

---

## 12. Развёртывание

### Railway (backend + bot)

```toml
# railway.toml
[build]
  builder = "NIXPACKS"
  buildCommand = "npm install"

[deploy]
  startCommand = "node server/src/app.js"
  restartPolicyType = "ON_FAILURE"
  restartPolicyMaxRetries = 3
```

```javascript
// app.js — webhook vs polling
if (process.env.NODE_ENV === 'production') {
  bot.launch({
    webhook: {
      domain: process.env.RAILWAY_STATIC_URL,
      port: process.env.PORT,
    }
  });
} else {
  bot.launch();
}
```

### Vercel (frontend)

```json
// vercel.json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### MongoDB Atlas

Создать бесплатный кластер M0, добавить IP 0.0.0.0/0 в Network Access (для Railway).

---

## 13. Спринты разработки

### Спринт 0 — Подготовка (3-5 дней)

- [x] Создать репозиторий, настроить структуру проекта
- [x] Подключить MongoDB Atlas
- [x] Создать Telegram-бота (BotFather)
- [x] Настроить переменные окружения (включая DeepSeek API key)
- [x] Базовый Express сервер + Telegraf бот (hello world)
- [x] React + Vite проект
- [x] Настроить pino-логирование
- [x] Deploy на Railway + Vercel (пустые)

### Спринт 1 — Авторизация и профиль (4-7 дней)

- [x] Mongoose схемы: User, Goal
- [x] POST /auth/telegram — валидация + JWT
- [x] Middleware аутентификации
- [x] Zod-схема для /auth/telegram
- [x] Centralized error handler
- [x] Telegram-бот: /start с онбордингом (2 шага)
- [x] GET/PUT /goals
- [x] Страница /login с Telegram Widget
- [x] Страница /settings — форма целей
- [x] Zustand: authStore
- [x] **TODO: Telegram Login Widget — подтверждение не приходит** (решено через Bot-Based Login)
    - Итог: ни старый виджет (попап), ни OIDC-редирект (oauth.telegram.org),
      ни комбинация с data-auth-url не доставляют подтверждение от Telegram.
      Это известное ограничение платформы (не зависит от кода).
    - Решение: Bot-Based Login — пользователь отправляет /login боту,
      бот генерирует одноразовый токен (5 мин TTL) и присылает ссылку.
      Переход по ссылке обменивает токен на JWT.

### Спринт 2 — Продукты (3-5 дней)

- [x] Mongoose схема: Product
- [x] CRUD /products + текстовый поиск
- [x] Zod-схемы для продуктов
- [x] Страница /products — список + поиск
- [x] Форма создания/редактирования продукта
- [x] Наполнить базу стартовыми продуктами (20-30 штук с БЖУ)
- [x] POST /products/:id/price

### Спринт 3 — Питание (7-10 дней) ← ЯДРО

- [x] Mongoose схемы: FoodLog, Recipe
- [x] AI Layer: DeepSeekProvider + ClaudeProvider + AIProviderFactory + aiClient
- [x] services/aiParser.js
- [x] services/nutritionCalc.js
- [x] **Unit-тесты для `nutritionCalc.js`** — 10-15 кейсов: расчёт БЖУ на порцию, суммирование totals, расчёт стоимости, граничные значения (0г, null цена). Инструмент: `node:test` (встроен в Node 20, без зависимостей)
- [x] Zod-схемы: foodLogSchemas.js
- [x] POST /food-logs/parse (с graceful degradation)
- [x] POST /food-logs
- [x] GET /food-logs (по дате и неделе)
- [x] PUT/DELETE /food-logs/:id
- [x] POST /food-logs/repeat
- [x] **Telegram-бот: парсинг свободного текста еды** — главная фича
- [x] Telegram-бот: ответ с нутриентами и прогрессом
- [x] Telegram-бот: сценарий graceful degradation при недоступности AI
- [x] Страница /diary — дневник питания
- [x] Компоненты: NutrientBar, FoodEntry, QuickAdd (модальное окно)

### Спринт 4 — Тренировки (4-5 дней)

- [x] Mongoose схема: Workout
- [x] services/caloriesBurned.js
- [x] **Unit-тесты для `caloriesBurned.js`** — 5-8 кейсов: разные типы тренировок (home/run/gym), граничные значения длительности, корректность MET-формулы
- [x] CRUD /workouts
- [x] Zod-схема: workoutSchemas.js
- [x] Telegram-бот: /train, парсинг результатов свободным текстом
- [x] Страница /workouts — список и просмотр тренировки
- [x] Форма ручного ввода тренировки

### Спринт 5 — Самочувствие и вес (3-4 дня)

- [x] Mongoose схемы: WellbeingLog, WeightLog
- [x] CRUD /wellbeing, /weight
- [x] Zod-схемы: weightSchemas.js, wellbeingSchemas.js
- [x] Telegram-бот: /feel, /weight
- [x] Страница /wellbeing — тепловая карта
- [x] Страница /weight — график со скользящим средним

### Спринт 6 — Dashboard и Recipes (4-6 дней)

- [ ] GET /dashboard/today + /dashboard/week
- [ ] CRUD /recipes
- [ ] Страница / (Dashboard) — все секции
- [ ] Компоненты: CalorieRing, WeightChart
- [ ] Страница /recipes — список и форма создания

### Спринт 7 — Напоминания (2-3 дня)

- [ ] reminderService.js — утренние и вечерние напоминания
- [ ] Настройки напоминаний в /settings

### Спринт 8 — Полировка MVP (5-7 дней)

- [ ] Проверка покрытия Zod-валидацией всех эндпоинтов
- [ ] Проверка обработки ошибок (typed errors везде)
- [ ] Проверка логирования (все критические пути)
- [ ] Загрузочные состояния и skeleton screens
- [ ] Пустые состояния (empty states) для всех страниц
- [ ] Тест на нетехническом пользователе
- [ ] Исправление критических UX-проблем
- [ ] README с инструкцией по запуску

**Итого: ~7-8 недель** при темпе 1 спринт/неделя

---

## 14. Критерии готовности MVP

MVP считается готовым, когда:

### Обязательные (must have)

- [ ] Пользователь может войти через Telegram
- [ ] Бот корректно парсит минимум 90% реальных фраз типа «съел 200г курицы и 150г риса» (через DeepSeek)
- [ ] При недоступности AI бот выводит понятное сообщение и кнопки для ручного ввода
- [ ] БЖУ рассчитываются правильно (проверено на 10 продуктах)
- [ ] Прогресс за день отображается в боте (/today) и на дашборде
- [ ] Тренировку можно записать через бота (свободный текст)
- [ ] Самочувствие и вес вносятся через бота
- [ ] Дашборд показывает прогресс и последние записи
- [ ] Работает утреннее напоминание
- [ ] Все API-ошибки возвращают единый JSON-формат
- [ ] Нет необработанных исключений, вызывающих падение сервера

### Желательные (should have)

- [ ] Функция «Повторить приём пищи»
- [ ] Рецепты и составные блюда
- [ ] График веса со скользящим средним
- [ ] Сравнение «эта неделя vs прошлая» на дашборде

### Не блокирующие (nice to have)

- [ ] Полировка UI
- [ ] Тепловая карта самочувствия
- [ ] История цен продуктов
- [ ] Бюджет на питание

---

## 15. Future Features (Production / V2)

Функциональность, перенесённая из MVP по соображениям управления рисками и объёмом.

---

### 15.1 Family System

Полный семейный режим с общими целями и взаимным прогрессом.

**Модели:**

- `FamilyGroup` (см. исходное ТЗ v1.0, раздел 4.10)

**API:**

```
GET  /api/family
POST /api/family/create
POST /api/family/join        Body: { inviteCode }
POST /api/family/invite
DELETE /api/family/leave
```

**Frontend:**

- Страница `/family`
- Карточка партнёра: прогресс по БЖУ, тренировка да/нет, самочувствие
- Инвайт-ссылка
- Общий бюджет на неделю

**Поля, которые вернутся в схемы:**

- `User.familyGroupId`
- `Product.isSharedWithFamily`

---

### 15.2 Workout Templates

Шаблоны тренировок для быстрого старта.

**Модели:**

- `WorkoutTemplate` (см. исходное ТЗ v1.0, раздел 4.7)

**API:**

```
GET    /api/workouts/templates
POST   /api/workouts/templates
PUT    /api/workouts/templates/:id
DELETE /api/workouts/templates/:id
```

**Workflow в боте:**

```
/train → выбор из шаблонов → старт тренировки
```

**Поля, которые вернутся в Workout:**

- `Workout.templateId`

---

### 15.3 Exercise History Analytics

Аналитика прогресса упражнений и личные рекорды.

**API:**

```
GET /api/workouts/exercise-history/:exerciseName
  Response: [{ date, sets, maxWeightKg, totalVolume }]
```

**Frontend:**

- График объёма по каждому упражнению (LineChart)
- Личные рекорды (PR badge)
- Детали тренировки: таблица подходов

---

### 15.4 Прочее (из оригинального видения продукта)

- OCR чеков и автоматическое распознавание цен
- Аналитика паттернов / причинно-следственные связи
- Рейтинг продуктов по €/г белка
- Сравнение цен по магазинам
- Умный список покупок
- Оптимизатор меню
- AI-коуч и недельные отчёты
- Экспорт данных
- Интеграция с умными весами

---

## 16. Architecture Decisions

### ADR-01: Family System убран из MVP

**Решение:** Полный семейный режим перенесён в Production/V2.

**Обоснование:**
Семейный режим требует отдельной модели `FamilyGroup`, invite-механизма, отдельных API-роутов, отдельной страницы, проверки прав доступа в каждом запросе и изменения схем User и Product. Это 8-10 дополнительных дней разработки при нулевом влиянии на основную ценность MVP (учёт питания и тренировок). Риск: незавершённый MVP из-за переусложнения первой версии. Семейный режим может быть добавлен как изолированный модуль поверх рабочего ядра.

---

### ADR-02: Workout Templates убраны из MVP

**Решение:** Шаблоны тренировок перенесены в Production/V2.

**Обоснование:**
В MVP тренировки вводятся свободным текстом через AI — этот путь проще для пользователя и не требует предварительного создания шаблонов. Шаблоны полезны при повторяющихся тренировках, но эту потребность невозможно подтвердить без первых реальных пользователей. Добавление шаблонов в MVP создаёт дополнительную модель, три API-эндпоинта, UI-вкладку и ветвление в боте.

---

### ADR-03: Exercise History Analytics убрана из MVP

**Решение:** Аналитика прогресса упражнений и PR перенесены в Production/V2.

**Обоснование:**
Аналитика прогресса требует накопленных данных минимум за 4-6 недель. Нет смысла строить сложные графики прогресса в системе, которой нет ещё ни одной реальной тренировки. MVP должен уметь сохранять и показывать тренировки — этого достаточно. Аналитика добавляется после накопления данных.

---

### ADR-04: AI Provider Abstraction Layer

**Решение:** Весь AI-код изолирован за интерфейсом `AIProvider`. Бизнес-логика работает только через `aiClient.js`.

**Обоснование:**
AI-рынок нестабилен: провайдеры меняют тарифы, вводят ограничения, недоступны. Без абстракции смена провайдера требует правок в нескольких местах кодовой базы и риска регрессий. С абстракцией — это одна переменная окружения. Дополнительная польза: легко тестировать бизнес-логику через mock-провайдер.

---

### ADR-05: DeepSeek как основной AI-провайдер

**Решение:** По умолчанию используется `DeepSeek Chat` через `DeepSeekProvider`.

**Обоснование:**
Задача парсинга еды проста: извлечь продукты и граммы из короткой фразы. Для этого не нужна модель класса Claude Opus или GPT-4. DeepSeek Chat на июнь 2025 значительно дешевле Claude Haiku при сопоставимом качестве на задачах структурированного извлечения. Claude остаётся как fallback через конфигурацию `AI_FALLBACK_PROVIDER=claude`. При изменении рынка достаточно поменять `AI_PROVIDER` в .env.

---

### ADR-06: Zod Validation

**Решение:** Все входящие данные API валидируются через Zod-схемы до попадания в контроллеры.

**Обоснование:**
Без валидации на уровне схем ошибки некорректных данных попадают вглубь бизнес-логики или в базу данных, где их сложнее диагностировать. Zod даёт: типобезопасные схемы, автоматические сообщения об ошибках, явный контракт для каждого эндпоинта. Middleware `validate()` даёт единый паттерн без дублирования проверок в каждом контроллере.

---

### ADR-07: Centralized Error Handler и Typed Errors

**Решение:** Все ошибки выбрасываются через классы из `errors/AppError.js` и перехватываются единым `errorHandler` middleware.

**Обоснование:**
Без централизованной обработки ошибок разные части кода возвращают разные форматы ошибок, что усложняет отладку и написание клиентского кода. Typed errors дают явные коды (`VALIDATION_ERROR`, `NOT_FOUND` и т.д.), по которым клиент может принимать решения. Единый middleware гарантирует, что ни одна ошибка не приведёт к утечке стека вызовов в ответе.

---

### ADR-08: Pino для логирования

**Решение:** Структурированное JSON-логирование через `pino`.

**Обоснование:**
Бессистемный `console.log` не позволяет фильтровать по уровням, не структурирован для поиска, не поддерживает redact-механизм для скрытия чувствительных данных. Pino — минимальный overhead, нативный JSON, поддержка уровней и redact-полей. В development используется `pino-pretty` для читаемого вывода. В production — raw JSON для парсинга Railway/Render логов.

---

### ADR-09: CommonJS вместо ESM

**Решение:** Backend использует CommonJS (`require` / `module.exports`). Миграция на ESM не планируется в рамках MVP.

**Обоснование:**
Выбор сознательный. На момент написания ТЗ ключевые зависимости — Telegraf 4.x, Mongoose 8.x, node-cron — работают в CJS без нареканий. ESM-экосистема Node.js остаётся неровной: часть пакетов публикует только ESM-сборки, что создаёт проблемы с динамическими импортами и смешанными графами зависимостей. Для MVP с двумя пользователями выигрыш от ESM (tree-shaking, top-level await) не покрывает риск отладки edge-cases совместимости.

**Условие пересмотра:** При добавлении зависимости, которая поставляется только как ESM (pure ESM package), вопрос миграции открывается заново. В этом случае переход делается целиком — не смешанный граф.

---

*Документ подготовлен для проекта NutriTrack. Версия 2.0*

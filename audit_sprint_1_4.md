# 🔍 Полный аудит проекта NutriTrack — Спринты 0–4

## Содержание
1. [Общий статус проекта](#1-общий-статус-проекта)
2. [Детальный аудит по спринтам](#2-детальный-аудит-по-спринтам)
3. [Сравнение UI с прототипами](#3-сравнение-ui-с-прототипами)
4. [Паритет форм: Веб ↔ Telegram-бот](#4-паритет-форм-веб--telegram-бот)
5. [Архитектурные и технические проверки](#5-архитектурные-и-технические-проверки)
6. [Сводная таблица проблем](#6-сводная-таблица-проблем)
7. [Рекомендации](#7-рекомендации)

---

## 1. Общий статус проекта

| Спринт | Задач по ТЗ | Выполнено | Статус |
|--------|:-----------:|:---------:|--------|
| Спринт 0 — Подготовка | 8 | 8 | ✅ Завершён |
| Спринт 1 — Авторизация | 10 | 10 | ✅ Завершён |
| Спринт 2 — Продукты | 7 | 7 | ✅ Завершён |
| Спринт 3 — Питание | 14 | 14 | ✅ Завершён |
| Спринт 4 — Тренировки | 7 | 7 | ✅ Завершён |
| Спринт 5 — Самочувствие и вес | 6 | 0 | ⬜ Не начат |
| Спринт 6+ | — | — | ⬜ Не начат |

**Общая готовность: Спринты 0–4 полностью завершены** ✅

---

## 2. Детальный аудит по спринтам

### Спринт 0 — Подготовка ✅

| Задача | Файл/Компонент | Статус |
|--------|----------------|--------|
| Репозиторий + структура | Структура `server/`, `client/` | ✅ |
| MongoDB Atlas подключение | [db.js](file:///Users/greg/Claude-projects/Nutritrack/server/src/config/db.js) | ✅ |
| Telegram-бот | [bot/index.js](file:///Users/greg/Claude-projects/Nutritrack/server/src/bot/index.js) | ✅ |
| Переменные окружения | [.env](file:///Users/greg/Claude-projects/Nutritrack/server/.env) | ✅ |
| Express + Telegraf | [app.js](file:///Users/greg/Claude-projects/Nutritrack/server/src/app.js) | ✅ |
| React + Vite | [client/](file:///Users/greg/Claude-projects/Nutritrack/client/) | ✅ |
| Pino-логирование | [logger.js](file:///Users/greg/Claude-projects/Nutritrack/server/src/logger.js) | ✅ |
| Deploy Railway + Vercel | `railway.toml`, `vercel.json` | ✅ |

### Спринт 1 — Авторизация и профиль ✅

| Задача | Файл/Компонент | Статус |
|--------|----------------|--------|
| Mongoose User, Goal | [User.js](file:///Users/greg/Claude-projects/Nutritrack/server/src/models/User.js), [Goal.js](file:///Users/greg/Claude-projects/Nutritrack/server/src/models/Goal.js) | ✅ |
| POST /auth/telegram + JWT | [auth.js](file:///Users/greg/Claude-projects/Nutritrack/server/src/routes/auth.js) | ✅ |
| Auth middleware | [auth.js](file:///Users/greg/Claude-projects/Nutritrack/server/src/middleware/auth.js) | ✅ |
| Zod-схема auth | [authSchemas.js](file:///Users/greg/Claude-projects/Nutritrack/server/src/validation/authSchemas.js) | ✅ |
| Centralized error handler | [errorHandler.js](file:///Users/greg/Claude-projects/Nutritrack/server/src/middleware/errorHandler.js), [AppError.js](file:///Users/greg/Claude-projects/Nutritrack/server/src/errors/AppError.js) | ✅ |
| /start + онбординг | [start.js](file:///Users/greg/Claude-projects/Nutritrack/server/src/bot/handlers/start.js) | ✅ |
| GET/PUT /goals | [goals.js](file:///Users/greg/Claude-projects/Nutritrack/server/src/routes/goals.js) | ✅ |
| Страница /login | [Login/](file:///Users/greg/Claude-projects/Nutritrack/client/src/pages/Login/) | ✅ |
| Страница /settings | [Settings/](file:///Users/greg/Claude-projects/Nutritrack/client/src/pages/Settings/) | ✅ |
| Zustand authStore | [authStore.js](file:///Users/greg/Claude-projects/Nutritrack/client/src/store/authStore.js) | ✅ |
| Bot-Based Login | [LoginToken/](file:///Users/greg/Claude-projects/Nutritrack/client/src/pages/LoginToken/) | ✅ (решение принято) |

### Спринт 2 — Продукты ✅

| Задача | Файл/Компонент | Статус |
|--------|----------------|--------|
| Mongoose Product | [Product.js](file:///Users/greg/Claude-projects/Nutritrack/server/src/models/Product.js) | ✅ |
| CRUD /products + текстовый поиск | [products.js](file:///Users/greg/Claude-projects/Nutritrack/server/src/routes/products.js) | ✅ |
| Zod-схемы для продуктов | [productSchemas.js](file:///Users/greg/Claude-projects/Nutritrack/server/src/validation/productSchemas.js) | ✅ |
| Страница /products | [Products/](file:///Users/greg/Claude-projects/Nutritrack/client/src/pages/Products/) | ✅ |
| Форма создания/редактирования | Внутри Products/index.jsx | ✅ |
| POST /products/:id/price | В routes/products.js | ✅ |

### Спринт 3 — Питание ✅

| Задача | Файл/Компонент | Статус |
|--------|----------------|--------|
| Mongoose FoodLog, Recipe | [FoodLog.js](file:///Users/greg/Claude-projects/Nutritrack/server/src/models/FoodLog.js), [Recipe.js](file:///Users/greg/Claude-projects/Nutritrack/server/src/models/Recipe.js) | ✅ |
| AI Layer (все 4 файла) | [services/ai/](file:///Users/greg/Claude-projects/Nutritrack/server/src/services/ai/) | ✅ |
| aiParser.js | [aiParser.js](file:///Users/greg/Claude-projects/Nutritrack/server/src/services/aiParser.js) | ✅ |
| nutritionCalc.js | [nutritionCalc.js](file:///Users/greg/Claude-projects/Nutritrack/server/src/services/nutritionCalc.js) | ✅ |
| Zod-схемы foodLogs | [foodLogSchemas.js](file:///Users/greg/Claude-projects/Nutritrack/server/src/validation/foodLogSchemas.js) | ✅ |
| POST /food-logs/parse | В routes/foodLogs.js | ✅ |
| CRUD /food-logs | [foodLogs.js](file:///Users/greg/Claude-projects/Nutritrack/server/src/routes/foodLogs.js) | ✅ |
| POST /food-logs/repeat | В routes/foodLogs.js | ✅ |
| Бот: парсинг еды | [food.js](file:///Users/greg/Claude-projects/Nutritrack/server/src/bot/handlers/food.js) | ✅ |
| Бот: graceful degradation | В food.js (возврат null + кнопки) | ✅ |
| Страница /diary | [Diary/](file:///Users/greg/Claude-projects/Nutritrack/client/src/pages/Diary/) | ✅ |
| Компоненты NutrientBar, FoodEntry, QuickAdd | [NutrientBar/](file:///Users/greg/Claude-projects/Nutritrack/client/src/components/NutrientBar/), [FoodEntry/](file:///Users/greg/Claude-projects/Nutritrack/client/src/components/FoodEntry/), [QuickAdd/](file:///Users/greg/Claude-projects/Nutritrack/client/src/components/QuickAdd/) | ✅ |

### Спринт 4 — Тренировки ✅

| Задача | Файл/Компонент | Статус |
|--------|----------------|--------|
| Mongoose Workout | [Workout.js](file:///Users/greg/Claude-projects/Nutritrack/server/src/models/Workout.js) | ✅ |
| caloriesBurned.js | [caloriesBurned.js](file:///Users/greg/Claude-projects/Nutritrack/server/src/services/caloriesBurned.js) | ✅ |
| CRUD /workouts | [workouts.js](file:///Users/greg/Claude-projects/Nutritrack/server/src/routes/workouts.js) | ✅ |
| Zod-схема workouts | [workoutSchemas.js](file:///Users/greg/Claude-projects/Nutritrack/server/src/validation/workoutSchemas.js) | ✅ |
| Бот: /train + парсинг | [workout.js](file:///Users/greg/Claude-projects/Nutritrack/server/src/bot/handlers/workout.js) | ✅ |
| Страница /workouts | [Workouts/index.jsx](file:///Users/greg/Claude-projects/Nutritrack/client/src/pages/Workouts/index.jsx) | ✅ |
| Форма ручного ввода | AddWorkoutModal в index.jsx | ✅ |
| Просмотр тренировки | [WorkoutDetail.jsx](file:///Users/greg/Claude-projects/Nutritrack/client/src/pages/Workouts/WorkoutDetail.jsx) | ✅ |

---

## 3. Сравнение UI с прототипами

### Прототип основных экранов (`nutritrack_mvp_prototype.html`)

````carousel
![Дашборд (прототип)](/Users/greg/.gemini/antigravity-ide/brain/c609c29e-e3f1-4c0f-a8b7-ae5886f13cfd/dashboard_view_1781026678434.png)
<!-- slide -->
![Дневник (прототип)](/Users/greg/.gemini/antigravity-ide/brain/c609c29e-e3f1-4c0f-a8b7-ae5886f13cfd/diary_view_1781026692465.png)
<!-- slide -->
![Тренировки (прототип)](/Users/greg/.gemini/antigravity-ide/brain/c609c29e-e3f1-4c0f-a8b7-ae5886f13cfd/workouts_view_1781026709462.png)
<!-- slide -->
![Самочувствие (прототип)](/Users/greg/.gemini/antigravity-ide/brain/c609c29e-e3f1-4c0f-a8b7-ae5886f13cfd/wellbeing_view_1781026727050.png)
<!-- slide -->
![Вес (прототип)](/Users/greg/.gemini/antigravity-ide/brain/c609c29e-e3f1-4c0f-a8b7-ae5886f13cfd/weight_view_1781026746876.png)
<!-- slide -->
![Продукты (прототип)](/Users/greg/.gemini/antigravity-ide/brain/c609c29e-e3f1-4c0f-a8b7-ae5886f13cfd/products_view_1781026765968.png)
````

### Прототип дополнительных экранов (`nutritrack_missing_screens.html`)

````carousel
![Форма тренировки (прототип)](/Users/greg/.gemini/antigravity-ide/brain/c609c29e-e3f1-4c0f-a8b7-ae5886f13cfd/workout_form_1781026836199.png)
<!-- slide -->
![Настройки (прототип)](/Users/greg/.gemini/antigravity-ide/brain/c609c29e-e3f1-4c0f-a8b7-ae5886f13cfd/settings_page_1781026851645.png)
<!-- slide -->
![Telegram-бот (прототип)](/Users/greg/.gemini/antigravity-ide/brain/c609c29e-e3f1-4c0f-a8b7-ae5886f13cfd/telegram_bot_1781026869747.png)
````

### Найденные расхождения UI ↔ Прототип

> [!IMPORTANT]
> Ниже перечислены все существенные расхождения между реализованным UI и эталонными прототипами.

#### 3.1 Общий Layout — **НЕ РЕАЛИЗОВАН** ❌

| Элемент | Прототип | Реализация | Критичность |
|---------|----------|------------|-------------|
| Sidebar (200px) | ✅ Полный sidebar с логотипом, навигацией, аватаром | ❌ **Отсутствует** — нет `Layout` компонента, страницы рендерятся без sidebar/topbar | 🔴 **Критично** |
| Topbar (52px) | ✅ Заголовок страницы + навигация по дням + кнопка «Добавить» | ❌ **Отсутствует** | 🔴 **Критично** |
| Навигация | ✅ Sidebar с секциями: Главное (Дашборд, Дневник, Тренировки), Здоровье (Самочувствие, Вес), Данные (Продукты) | ❌ **Нет навигации** между страницами через UI | 🔴 **Критично** |

#### 3.2 Дашборд (/) — **Заглушка** ❌

| Элемент | Прототип | Реализация | 
|---------|----------|------------|
| Кольцо калорий | ✅ SVG RadialBar + легенда | ❌ Заглушка: «Dashboard будет здесь (Спринт 6)» |
| Прогресс-бары БЖУ | ✅ 4 бара | ❌ |
| Стат-карточки (Вес/Вода/Тренировка/Бюджет) | ✅ grid-4 | ❌ |
| Последние приёмы + «Повторить» | ✅ | ❌ |
| График веса 14 дней | ✅ SVG | ❌ |
| БЖУ за неделю | ✅ Grouped bar chart | ❌ |

> [!NOTE]
> Дашборд отнесён к Спринту 6 по ТЗ — это **ожидаемо**. Но заглушка слишком примитивна для текущего состояния проекта.

#### 3.3 Дневник (/diary) — Частично реализован ⚠️

| Элемент | Прототип | Реализация |
|---------|----------|------------|
| Навигация по дням | ✅ Кнопки ← / → с текущей датой | ✅ Есть, но стилизация минимальная (← → текстом, а не Tabler Icons) |
| Группировка по приёмам (Завтрак/Обед/Ужин/Перекус) | ✅ С иконками и суммами | ✅ Есть, но иконки emoji вместо Tabler Icons |
| Карточка продукта | ✅ Имя + граммы + чипы Б/Ж/У + калории + кнопки ✏️🗑 | ⚠️ Зависит от FoodEntry — надо проверить |
| Модальное окно добавления | ✅ Поиск + debounce + карточки продуктов | ✅ QuickAdd реализован с поиском + свободным текстом |
| Итого за день | ✅ С БЖУ + калории + стоимость | ⚠️ Есть, но стоимость не показывается |
| Чипы макронутриентов | ✅ `.chip-p`: bg #E6F1FB, color #185FA5 | ⚠️ Проверить FoodEntry |

#### 3.4 Тренировки (/workouts) — Частично реализован ⚠️

| Элемент | Прототип | Реализация |
|---------|----------|------------|
| Список тренировок с группировкой по неделям | ✅ | ✅ |
| Карточки тренировок (иконка + название + дата + пиллы) | ✅ | ✅ (emoji вместо Tabler Icons) |
| Просмотр тренировки (упражнения + подходы + пиллы) | ✅ | ✅ Реализован отдельной страницей WorkoutDetail |
| Шаблоны тренировок | ✅ В прототипе есть | ❌ **Правильно** — ADR-02, шаблоны вне MVP |
| PR-бейджи | ✅ В прототипе есть | ❌ **Правильно** — ADR-03, PR вне MVP |
| График прогресса упражнений | ✅ В прототипе есть | ❌ **Правильно** — ADR-03, вне MVP |

#### 3.5 Форма добавления тренировки — Критическое расхождение 🔴

| Элемент | Прототип (missing_screens) | Реализация (web) | Telegram-бот |
|---------|---------------------------|------------------|--------------|
| **Название** | ✅ `<input>` | ✅ `<input>` | ✅ AI парсит из текста |
| **Тип** (home/gym/run/bike/swim) | ✅ Кнопки-чипы (Домашняя/Зал/Бег) | ⚠️ `<select>` dropdown | ✅ AI парсит |
| **Длительность (мин)** | ✅ `<input type=number>` | ✅ `<input type=number>` | ✅ AI парсит |
| **Сложность (1-10)** | ✅ `<input type=number>` | ✅ `<input type=number>` | ✅ AI парсит |
| **Расход калорий** | ✅ Авторасчёт с отображением | ❌ **Не показан в форме** — рассчитывается на сервере, но не отображается пользователю | ✅ Показан в ответе |
| **Заметки** | ✅ `<textarea>` | ⚠️ `<input type=text>` вместо `<textarea>` | ❌ Нет |
| **Упражнения** | ✅ **Полная форма**: название + подходы (повт × вес) + кнопка «+ Подход» + кнопка «+ Упражнение» | ❌ **ОТСУТСТВУЕТ ПОЛНОСТЬЮ** — на вебе нельзя добавить упражнения! | ✅ AI парсит из текста |

> [!CAUTION]
> **Критическое расхождение**: Форма добавления тренировки на вебе **не позволяет вводить упражнения с подходами** (exercises с sets). В прототипе это развёрнутая форма с полями Подход/Повторения/Вес для каждого упражнения. В Telegram-боте упражнения парсятся AI из свободного текста — там это работает. Но на вебе пользователь может создать только «пустую» тренировку без упражнений.

#### 3.6 Настройки (/settings) — Частично ⚠️

| Элемент | Прототип | Реализация |
|---------|----------|------------|
| Секция «Профиль» (аватар + имя + вес + рост + часовой пояс) | ✅ | ❌ **Нет** — только поля целей |
| Секция «Цели на день» | ✅ Б/Ж/У/Клетчатка + авто-калории + вода + бюджет | ✅ Реализовано |
| Авто-расчёт калорий (p×4 + f×9 + c×4) | ✅ | ✅ `computedCalories` |
| Секция «Напоминания» | ✅ Утреннее/Вечернее/Вода с чекбоксами | ❌ **Нет** — напоминания в Спринт 7 |

#### 3.7 Продукты (/products) — Хорошо реализован ✅

Страница продуктов имеет развёрнутую реализацию с поиском, формой создания/редактирования, историей цен, и отображением БЖУ.

#### 3.8 Цвета нутриентов — Расхождение ⚠️

| Нутриент | Прототип (CLAUDE.md) | Diary NutrientBar |
|----------|---------------------|-------------------|
| Белки | `--nt-blue-mid` (#378ADD) | `#4f8ef7` ❌ |
| Жиры | `--nt-amber-mid` (#BA7517) | `#f6ad55` ❌ |
| Углеводы | `--nt-green-mid` (#639922) | `#68d391` ❌ |
| Клетчатка | `--nt-teal-mid` (#1D9E75) | `#9f7aea` ❌ (фиолетовый!) |

> [!WARNING]
> **Все 4 цвета нутриентов в NutrientBar захардкожены и НЕ соответствуют дизайн-системе прототипа.** Клетчатка вообще фиолетовая (`#9f7aea`) вместо бирюзовой (`--nt-teal-mid`). Цвета передаются как props `color=` из Diary/index.jsx, а не берутся из CSS-переменных.

---

## 4. Паритет форм: Веб ↔ Telegram-бот

### 4.1 Добавление еды

| Поле / Функция | Telegram-бот | Веб (QuickAdd) | Паритет |
|----------------|:------------:|:--------------:|:-------:|
| Свободный текст | ✅ Основной режим — AI парсит | ✅ Вкладка «Свободный текст» | ✅ |
| Тип приёма (завтрак/обед/ужин/перекус) | ✅ Автодетект из текста | ✅ Задаётся кнопкой в Diary (контекст mealType) | ✅ |
| Поиск продукта | ❌ Нет — только свободный текст | ✅ Вкладка «Поиск продукта» + debounce | ➕ Веб больше |
| Дата | ✅ Автоматически — сегодня | ✅ Из контекста Diary (навигация по дням) | ✅ |
| Граммы | ✅ AI парсит из текста | ✅ Поле ввода после выбора продукта | ✅ |
| Graceful degradation (AI недоступен) | ✅ Кнопки «Ввести вручную» / «Попробовать снова» | ✅ Сообщение об ошибке | ✅ |
| Ответ с нутриентами | ✅ Б/Ж/У + калории + прогресс | ⚠️ Просто перезагрузка страницы | ⚠️ |

**Вывод**: Формы добавления еды **в целом паритетны**. Веб даже предоставляет расширенный функционал (поиск продукта + свободный текст).

### 4.2 Добавление тренировки

| Поле / Функция | Telegram-бот | Веб (AddWorkoutModal) | Прототип | Паритет |
|----------------|:------------:|:---------------------:|:--------:|:-------:|
| Название | ✅ AI парсит | ✅ Input | ✅ | ✅ |
| Тип (home/gym/run…) | ✅ AI парсит | ✅ Select dropdown | ✅ Кнопки | ⚠️ |
| Дата | ✅ Авто (сегодня) | ✅ Input date | ✅ | ✅ |
| Длительность (мин) | ✅ AI парсит | ✅ Input number | ✅ | ✅ |
| Сложность (1-10) | ✅ AI парсит | ✅ Input number | ✅ | ✅ |
| Заметки | ❌ Нет | ✅ Input text | ✅ Textarea | ⚠️ |
| **Упражнения** | ✅ **AI парсит полностью** (название + подходы × повт × вес) | ❌ **НЕТ** | ✅ **Полная форма** | 🔴 **Критично** |
| **Расход калорий** | ✅ Показан в ответе | ❌ Не показан | ✅ Авторасчёт | ⚠️ |

> [!CAUTION]
> **Главная проблема паритета**: Через Telegram-бот можно описать тренировку свободным текстом и AI извлечёт все упражнения с подходами, повторениями и весами. На вебе же форма позволяет создать тренировку **только с метаданными** (название, тип, длительность, сложность) **без единого упражнения**. Это прямое противоречие с прототипом `nutritrack_missing_screens.html`, где форма тренировки содержит полный редактор упражнений с подходами.

---

## 5. Архитектурные и технические проверки

### 5.1 ADR Compliance ✅

| ADR | Требование | Статус |
|-----|-----------|--------|
| ADR-01 | Family System вне MVP | ✅ Не реализован |
| ADR-02 | Workout Templates вне MVP | ✅ Не реализован |
| ADR-03 | Exercise History Analytics вне MVP | ✅ Не реализован |
| ADR-04 | AI через aiClient.js | ✅ parseFood и parseWorkout через aiClient |
| ADR-05 | DeepSeek primary, Claude fallback | ✅ Настроено через .env |
| ADR-06 | Zod validation | ✅ Схемы для auth, products, foodLogs, workouts, goals, recipes |
| ADR-07 | Centralized Error Handler | ✅ AppError + errorHandler middleware |
| ADR-08 | Pino для логирования | ✅ logger.js, requestLogger.js |
| ADR-09 | CommonJS на бэкенде | ✅ Используется require/module.exports |

### 5.2 Технические проверки

| Проверка | Результат |
|----------|-----------|
| `console.log` на сервере | ✅ Нет — только `logger.*` |
| Zod на всех POST/PUT | ✅ validate() middleware подключен |
| Ошибки через AppError | ✅ NotFoundError, AuthorizationError, etc. |
| JWT на всех роутах (кроме /auth) | ✅ `router.use(auth)` в каждом файле |
| AI Layer graceful degradation | ✅ Возвращает null, бот показывает fallback |
| CSS-переменные из дизайн-системы | ✅ Определены в index.css — но **не используются в компонентах** (см. п.3.8) |

### 5.3 Отсутствующие файлы/маршруты по ТЗ

| Элемент | Статус | Спринт |
|---------|--------|--------|
| Модель WellbeingLog | ❌ Не создана | Спринт 5 |
| Модель WeightLog | ❌ Не создана | Спринт 5 |
| Роуты /wellbeing | ❌ Нет файла | Спринт 5 |
| Роуты /weight | ❌ Нет файла | Спринт 5 |
| Роуты /dashboard | ❌ Нет файла | Спринт 6 |
| Валидация wellbeingSchemas | ❌ Нет файла | Спринт 5 |
| Валидация weightSchemas | ❌ Нет файла | Спринт 5 |
| Bot handlers: weight, wellbeing, settings | ❌ Нет файлов | Спринт 5 |
| Layout компонент (Sidebar + Topbar) | ❌ Нет | Должен быть к текущему моменту |
| DashboardStore | ❌ Нет (указан в ТЗ раздел 3) | Спринт 6 |
| GoalsStore | ❌ Нет (указан в ТЗ раздел 3) | — |

### 5.4 Zustand Stores

| Store | По ТЗ | Реализован |
|-------|:-----:|:----------:|
| authStore | ✅ | ✅ |
| dashboardStore | ✅ | ❌ |
| goalsStore | ✅ | ❌ |
| diaryStore | — (не в ТЗ) | ✅ (самодеятельность, но полезный) |

---

## 6. Сводная таблица проблем

| # | Проблема | Критичность | Спринт |
|---|---------|:-----------:|:------:|
| 1 | Layout (Sidebar + Topbar) полностью отсутствует — нет навигации между страницами | 🔴 Критично | 0-4 |
| 2 | Форма тренировки на вебе не позволяет добавлять упражнения (exercises) | 🔴 Критично | 4 |
| 3 | Цвета NutrientBar не соответствуют дизайн-системе прототипа | 🟡 Среднее | 3 |
| 4 | Клетчатка отображается фиолетовой (#9f7aea) вместо бирюзовой (--nt-teal-mid) | 🟡 Среднее | 3 |
| 5 | Расход калорий не отображается в форме тренировки (авторасчёт скрыт) | 🟡 Среднее | 4 |
| 6 | Заметки к тренировке — `<input>` вместо `<textarea>` (как в прототипе) | 🟢 Мелочь | 4 |
| 7 | Тип тренировки — `<select>` вместо кнопок-чипов (как в прототипе) | 🟢 Мелочь | 4 |
| 8 | Навигация по дням — текст «← →» вместо Tabler Icons `ti-chevron-left/right` | 🟢 Мелочь | 3 |
| 9 | Иконки тренировок — emoji вместо Tabler Icons | 🟢 Мелочь | 4 |
| 10 | Стоимость не отображается в итого за день (Diary) | 🟢 Мелочь | 3 |
| 11 | Профиль (вес/рост/timezone) не редактируется на странице Settings | 🟡 Среднее | 1 |

---

## 7. Рекомендации

### Приоритет 1 — Критические исправления (перед Спринтом 5)

1. **Создать Layout компонент** (Sidebar + Topbar) — без навигации приложением невозможно пользоваться. Это должно было быть сделано ещё в Спринте 0/1.

2. **Добавить редактор упражнений в форму тренировки** — форма `AddWorkoutModal` должна позволять:
   - Добавлять упражнения (название)
   - Для каждого упражнения — добавлять подходы (reps, weightKg, durationSec)
   - Кнопки «+ Упражнение» и «+ Подход»
   - Отображение расчётного расхода калорий

3. **Исправить цвета NutrientBar** — использовать CSS-переменные из дизайн-системы вместо захардкоженных hex-значений:
   - Белки: `var(--nt-blue-mid)` (#378ADD)
   - Жиры: `var(--nt-amber-mid)` (#BA7517)
   - Углеводы: `var(--nt-green-mid)` (#639922)
   - Клетчатка: `var(--nt-teal-mid)` (#1D9E75)

### Приоритет 2 — Полировка UI (по мере спринтов)

4. Заменить текстовые стрелки навигации на Tabler Icons
5. Тип тренировки: кнопки-чипы вместо select
6. Заметки: textarea вместо input
7. Показывать стоимость в итогах дневника
8. Добавить профиль (вес/рост) в Settings

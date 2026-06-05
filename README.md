# NutriTrack

Персональный трекер питания, тренировок и самочувствия.

## Быстрый старт

### 1. Клонировать репозиторий

```bash
git clone <repo-url>
cd nutritrack
```

### 2. Настроить переменные окружения

```bash
cd server
cp .env.example .env
# Отредактировать .env — указать реальные значения:
#   MONGODB_URI — строка подключения MongoDB Atlas
#   BOT_TOKEN   — токен Telegram-бота (получить у @BotFather)
```

### 3. Запустить backend

```bash
cd server
npm install
npm run dev
```

Сервер запустится на http://localhost:3001.

Проверка:
```bash
curl http://localhost:3001/health
# {"status":"ok","timestamp":"..."}
```

### 4. Запустить frontend

```bash
cd client
npm install
npm run dev
```

Приложение откроется на http://localhost:5173.

### 5. Проверить Telegram-бота

Найти бота в Telegram и отправить `/start`. Бот должен ответить «Привет! Бот NutriTrack работает.»

## Деплой

- **Backend**: Railway — определяется `railway.toml`
- **Frontend**: Vercel — определяется `vercel.json`
- **Database**: MongoDB Atlas M0 (бесплатный кластер)

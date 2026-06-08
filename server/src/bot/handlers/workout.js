const Workout = require('../../models/Workout');
const User = require('../../models/User');
const { parseWorkout } = require('../../services/ai/aiClient');
const { calcCaloriesBurned } = require('../../services/caloriesBurned');
const logger = require('../../logger');
const { getTodayDate } = require('../utils');

/**
 * Handler for /train command and workout text input.
 *
 * Flow:
 *  1. /train → bot sends instruction, sets botState = 'awaiting_workout'
 *  2. User sends workout text → bot parses via AI, saves, replies with summary
 *  3. /cancel → resets botState to 'idle'
 */

async function trainCommandHandler(ctx) {
  const user = ctx.user;
  if (!user) return;

  await User.updateOne({ _id: user._id }, { botState: 'awaiting_workout' });

  return ctx.reply(
    '💪 Опиши свою тренировку свободным текстом.\n\n' +
    'Например:\n' +
    '«Сделал жим лёжа 3×10 по 80 кг, приседания 4×8 по 100 кг, 60 минут, сложность 7»\n\n' +
    'Для отмены напиши /cancel',
  );
}

async function handleWorkoutInput(ctx) {
  const user = ctx.user;
  const input = ctx.message?.text;

  if (!input) return;

  await ctx.sendChatAction('typing');

  let parsed;
  try {
    parsed = await parseWorkout(input);
  } catch (err) {
    logger.error({ err, userId: user._id.toString() }, 'Workout AI parser threw unexpectedly');
    parsed = null;
  }

  // Reset bot state before replying
  await User.updateOne({ _id: user._id }, { botState: 'idle' });

  if (parsed === null) {
    const webappUrl = process.env.WEBAPP_URL || 'https://nutritrack-topaz.vercel.app';
    return ctx.reply(
      '😕 Не удалось разобрать тренировку. Попробуй описать её подробнее.\n' +
      'Например: «Жим лёжа 3×10 80кг, бег 30 минут, сложность 8»\n\n' +
      `Или запиши тренировку вручную: ${webappUrl}/workouts`,
    );
  }

  const today = getTodayDate();
  const weightKg = user.weightKg || 75;
  const type = parsed.type || 'other';
  const durationMinutes = parsed.durationMinutes || null;
  const caloriesBurned = durationMinutes
    ? calcCaloriesBurned(type, durationMinutes, weightKg)
    : 0;

  const workout = await Workout.create({
    userId:          user._id,
    date:            today,
    name:            parsed.name || 'Тренировка',
    type,
    exercises:       parsed.exercises || [],
    durationMinutes,
    perceivedEffort: parsed.perceivedEffort || null,
    caloriesBurned,
  });

  logger.info(
    { userId: user._id.toString(), workoutId: workout._id.toString(), date: today },
    'Workout logged via bot',
  );

  // Build reply
  const exerciseLines = (parsed.exercises || [])
    .map((ex) => {
      if (!ex.sets || ex.sets.length === 0) return `• ${ex.name}`;
      const setsStr = ex.sets
        .map((s) => {
          const parts = [];
          if (s.reps) parts.push(`${s.reps} повт`);
          if (s.weightKg) parts.push(`${s.weightKg} кг`);
          if (s.durationSec) parts.push(`${s.durationSec} сек`);
          return parts.join(' × ');
        })
        .join(', ');
      return `• ${ex.name}: ${setsStr}`;
    })
    .join('\n');

  const durationStr = durationMinutes ? `${durationMinutes} мин` : '—';
  const effortStr = parsed.perceivedEffort ? `${parsed.perceivedEffort}/10` : '—';

  let message =
    `💪 Тренировка сохранена!\n` +
    (exerciseLines ? `${exerciseLines}\n` : '') +
    `Длительность: ${durationStr} | Сложность: ${effortStr}\n` +
    `Расход калорий: ~${caloriesBurned} ккал`;

  if (caloriesBurned > 0) {
    message += `\n\nДневная норма скорректирована: +${caloriesBurned} ккал`;
  }

  return ctx.reply(message);
}

module.exports = { trainCommandHandler, handleWorkoutInput };
